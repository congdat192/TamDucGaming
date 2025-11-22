'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Stats {
  totalUsers: number
  totalGames: number
  totalVouchers: number
  totalReferrals: number
}

interface Campaign {
  id: string
  name: string
  description: string
  start_date: string
  end_date: string
  is_active: boolean
}

interface VoucherTier {
  minScore: number
  value: number
  label: string
}

interface GameConfig {
  maxPlaysPerDay: number
  bonusPlaysForPhone: number
  bonusPlaysForReferral: number
  voucherTiers: VoucherTier[]
  testEmails: string[]
  testPhones: string[]
}

type Tab = 'dashboard' | 'config' | 'campaigns'

const DEFAULT_CONFIG: GameConfig = {
  maxPlaysPerDay: 1,
  bonusPlaysForPhone: 3,
  bonusPlaysForReferral: 1,
  voucherTiers: [
    { minScore: 30, value: 150000, label: '150K' },
    { minScore: 20, value: 100000, label: '100K' },
    { minScore: 10, value: 50000, label: '50K' },
  ],
  testEmails: ['test@test.com', 'admin@matkinhtamduc.com', 'congdat192@gmail.com'],
  testPhones: ['0909999999', '0123456789'],
}

export default function AdminPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  // Config state
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG)
  const [configLoading, setConfigLoading] = useState(false)

  // New campaign form
  const [showCampaignForm, setShowCampaignForm] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: ''
  })

  useEffect(() => {
    const adminToken = localStorage.getItem('admin-token')
    if (adminToken) {
      setIsLoggedIn(true)
      fetchAdminData()
      fetchConfig()
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại')
      }

      localStorage.setItem('admin-token', data.token)
      setIsLoggedIn(true)
      fetchAdminData()
      fetchConfig()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
    } finally {
      setLoading(false)
    }
  }

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('admin-token')

      const [statsRes, campaignsRes] = await Promise.all([
        fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/campaigns', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json()
        setCampaigns(campaignsData.campaigns || [])
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    }
  }

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('admin-token')
      const res = await fetch('/api/admin/config', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setConfig({ ...DEFAULT_CONFIG, ...data })
      }
    } catch (error) {
      console.error('Failed to fetch config:', error)
    }
  }

  const handleSaveConfig = async () => {
    setConfigLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('admin-token')
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess('Cấu hình đã được lưu!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
    } finally {
      setConfigLoading(false)
    }
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('admin-token')
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newCampaign)
      })

      if (res.ok) {
        setShowCampaignForm(false)
        setNewCampaign({ name: '', description: '', start_date: '', end_date: '' })
        fetchAdminData()
      }
    } catch (error) {
      console.error('Failed to create campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin-token')
    setIsLoggedIn(false)
  }

  const updateVoucherTier = (index: number, field: keyof VoucherTier, value: string | number) => {
    const newTiers = [...config.voucherTiers]
    newTiers[index] = { ...newTiers[index], [field]: field === 'label' ? value : Number(value) }
    setConfig({ ...config, voucherTiers: newTiers })
  }

  const addVoucherTier = () => {
    setConfig({
      ...config,
      voucherTiers: [...config.voucherTiers, { minScore: 0, value: 0, label: '' }]
    })
  }

  const removeVoucherTier = (index: number) => {
    const newTiers = config.voucherTiers.filter((_, i) => i !== index)
    setConfig({ ...config, voucherTiers: newTiers })
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            🔐 Admin Login
          </h1>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="text-gray-500 text-sm text-center mt-4">
            Liên hệ quản trị viên để lấy thông tin đăng nhập
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">
            🎅 Santa Jump Admin
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Đăng xuất
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['dashboard', 'config', 'campaigns'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab === 'dashboard' && '📊 Dashboard'}
              {tab === 'config' && '⚙️ Cấu hình'}
              {tab === 'campaigns' && '📅 Chiến dịch'}
            </button>
          ))}
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-2 rounded-lg mb-4">
            {success}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800 rounded-xl p-4">
                  <div className="text-3xl font-bold text-blue-400">{stats.totalUsers}</div>
                  <div className="text-gray-400">Người dùng</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-4">
                  <div className="text-3xl font-bold text-green-400">{stats.totalGames}</div>
                  <div className="text-gray-400">Lượt chơi</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-4">
                  <div className="text-3xl font-bold text-yellow-400">{stats.totalVouchers}</div>
                  <div className="text-gray-400">Vouchers</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-4">
                  <div className="text-3xl font-bold text-purple-400">{stats.totalReferrals}</div>
                  <div className="text-gray-400">Referrals</div>
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a
                href="/"
                target="_blank"
                className="bg-gray-800 rounded-xl p-4 text-center hover:bg-gray-700 transition-colors"
              >
                <div className="text-2xl mb-2">🎮</div>
                <div className="text-white">Xem Game</div>
              </a>
              <a
                href="/leaderboard"
                target="_blank"
                className="bg-gray-800 rounded-xl p-4 text-center hover:bg-gray-700 transition-colors"
              >
                <div className="text-2xl mb-2">🏆</div>
                <div className="text-white">Leaderboard</div>
              </a>
              <button
                onClick={fetchAdminData}
                className="bg-gray-800 rounded-xl p-4 text-center hover:bg-gray-700 transition-colors"
              >
                <div className="text-2xl mb-2">🔄</div>
                <div className="text-white">Refresh</div>
              </button>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                className="bg-gray-800 rounded-xl p-4 text-center hover:bg-gray-700 transition-colors"
              >
                <div className="text-2xl mb-2">🗃️</div>
                <div className="text-white">Supabase</div>
              </a>
            </div>
          </>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            {/* Gameplay Settings */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">🎮 Cài đặt Gameplay</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">Lượt chơi miễn phí/ngày</label>
                  <input
                    type="number"
                    value={config.maxPlaysPerDay}
                    onChange={(e) => setConfig({ ...config, maxPlaysPerDay: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">Bonus khi thêm SĐT</label>
                  <input
                    type="number"
                    value={config.bonusPlaysForPhone}
                    onChange={(e) => setConfig({ ...config, bonusPlaysForPhone: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">Bonus khi giới thiệu bạn</label>
                  <input
                    type="number"
                    value={config.bonusPlaysForReferral}
                    onChange={(e) => setConfig({ ...config, bonusPlaysForReferral: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Voucher Tiers */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">🎁 Voucher Tiers</h2>
                <button
                  onClick={addVoucherTier}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  + Thêm tier
                </button>
              </div>
              <div className="space-y-3">
                {config.voucherTiers.map((tier, index) => (
                  <div key={index} className="flex gap-3 items-center bg-gray-700 rounded-lg p-3">
                    <div className="flex-1">
                      <label className="block text-gray-400 text-xs mb-1">Điểm tối thiểu</label>
                      <input
                        type="number"
                        value={tier.minScore}
                        onChange={(e) => updateVoucherTier(index, 'minScore', e.target.value)}
                        className="w-full px-3 py-1 bg-gray-600 rounded text-white text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-gray-400 text-xs mb-1">Giá trị (VNĐ)</label>
                      <input
                        type="number"
                        value={tier.value}
                        onChange={(e) => updateVoucherTier(index, 'value', e.target.value)}
                        className="w-full px-3 py-1 bg-gray-600 rounded text-white text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-gray-400 text-xs mb-1">Label</label>
                      <input
                        type="text"
                        value={tier.label}
                        onChange={(e) => updateVoucherTier(index, 'label', e.target.value)}
                        className="w-full px-3 py-1 bg-gray-600 rounded text-white text-sm"
                      />
                    </div>
                    <button
                      onClick={() => removeVoucherTier(index)}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm mt-4"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Accounts */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">🧪 Tài khoản Test (Unlimited plays)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">Email test (phân cách bằng dấu phẩy)</label>
                  <textarea
                    value={config.testEmails.join(', ')}
                    onChange={(e) => setConfig({ ...config, testEmails: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">SĐT test (phân cách bằng dấu phẩy)</label>
                  <textarea
                    value={config.testPhones.join(', ')}
                    onChange={(e) => setConfig({ ...config, testPhones: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveConfig}
                disabled={configLoading}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {configLoading ? 'Đang lưu...' : '💾 Lưu cấu hình'}
              </button>
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">📅 Chiến dịch</h2>
              <button
                onClick={() => setShowCampaignForm(!showCampaignForm)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Tạo mới
              </button>
            </div>

            {showCampaignForm && (
              <form onSubmit={handleCreateCampaign} className="bg-gray-700 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-1 text-sm">Tên chiến dịch</label>
                    <input
                      type="text"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-600 rounded text-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 text-sm">Mô tả</label>
                    <input
                      type="text"
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-600 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 text-sm">Ngày bắt đầu</label>
                    <input
                      type="datetime-local"
                      value={newCampaign.start_date}
                      onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-600 rounded text-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 text-sm">Ngày kết thúc</label>
                    <input
                      type="datetime-local"
                      value={newCampaign.end_date}
                      onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-600 rounded text-white text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Tạo chiến dịch
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCampaignForm(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {campaigns.length === 0 ? (
                <p className="text-gray-400">Chưa có chiến dịch nào</p>
              ) : (
                campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between bg-gray-700 rounded-lg p-4"
                  >
                    <div>
                      <h3 className="text-white font-semibold">{campaign.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {new Date(campaign.start_date).toLocaleDateString('vi-VN')} -{' '}
                        {new Date(campaign.end_date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        campaign.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {campaign.is_active ? 'Đang chạy' : 'Đã kết thúc'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
