'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  phone: string | null
  email: string | null
  name: string | null
  total_score: number
  bonus_plays: number
  plays_today: number
  referral_code: string
  total_referrals?: number
  total_games_played?: number
}

interface Reward {
  id: string
  name: string
  description: string
  type: 'voucher' | 'gift'
  value: number
  points_required: number
  image_url?: string
  stock: number
}

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onUserUpdate: () => void
  onLogout?: () => void
}

type Tab = 'profile' | 'rewards'

export default function ProfileModal({ isOpen, onClose, user, onUserUpdate, onLogout }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loadingRewards, setLoadingRewards] = useState(false)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [config, setConfig] = useState({ maxPlaysPerDay: 3 }) // Default fallback

  useEffect(() => {
    // Fetch public config
    fetch('/api/config/public')
      .then(res => res.json())
      .then(data => setConfig(data.config))
      .catch(err => console.error('Failed to load config:', err))
  }, [])

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setPhone(user.phone || '')
    }
  }, [user])

  useEffect(() => {
    if (isOpen && activeTab === 'rewards') {
      loadRewards()
    }
  }, [isOpen, activeTab])

  useEffect(() => {
    // Reset messages when modal opens
    if (isOpen) {
      setError('')
      setSuccess('')
    }
  }, [isOpen])

  if (!isOpen || !user) return null

  const loadRewards = async () => {
    setLoadingRewards(true)
    try {
      const res = await fetch('/api/rewards/list')
      if (res.ok) {
        const data = await res.json()
        setRewards(data.rewards || [])
      }
    } catch (err) {
      console.error('Failed to load rewards:', err)
    } finally {
      setLoadingRewards(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Không thể cập nhật')
      }

      setSuccess('Cập nhật thành công!')
      onUserUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || phone.length < 10) {
      setError('Số điện thoại không hợp lệ (cần 10 số)')
      return
    }

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/user/add-phone-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Không thể cập nhật')
      }

      setSuccess(`🎉 ${data.message}`)
      onUserUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
    } finally {
      setLoading(false)
    }
  }

  const handleRedeemReward = async (rewardId: string) => {
    setRedeeming(rewardId)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Không thể đổi quà')
      }

      setSuccess(`🎉 ${data.message}`)
      onUserUpdate()
      loadRewards()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
    } finally {
      setRedeeming(null)
    }
  }

  // Check if user needs to add phone (logged in via email but no phone)
  const canAddPhone = !user.phone

  // Get display name
  const displayName = user.name || (user.email ? user.email.split('@')[0] : user.phone) || 'Người chơi'

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="relative bg-[#0f172a]/90 backdrop-blur-md rounded-3xl p-6 max-w-md w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
        >
          ✕
        </button>

        {/* Header - 2 Columns */}
        <div className="flex items-center gap-4 mb-6 bg-white/5 rounded-2xl p-4 border border-white/5">
          {/* Left: Avatar */}
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-4 border-[#0f172a] shrink-0">
            <span className="text-4xl">🎅</span>
          </div>

          {/* Right: Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <h2 className="text-lg font-bold text-white truncate">
              {name || displayName}
            </h2>
            <div className="space-y-0.5 text-xs">
              <p className="text-white/60 flex items-center gap-2">
                <span className="w-4 text-center">📱</span>
                <span className="truncate">{user.phone || 'Chưa cập nhật'}</span>
              </p>
              <p className="text-white/60 flex items-center gap-2">
                <span className="w-4 text-center">📧</span>
                <span className="truncate">{user.email || 'Chưa cập nhật'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Stats List */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-6 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm">Tổng điểm:</span>
            <span className="text-yellow-400 font-bold text-base">{user.total_score}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm">Tổng số lượt chơi:</span>
            <span className="text-white font-bold text-base">{user.total_games_played || 0}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm">Lượt chơi đang có:</span>
            <span className="text-green-400 font-bold text-base">
              {Math.max(0, config.maxPlaysPerDay - (user.plays_today || 0)) + user.bonus_plays}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm">Tổng số lượt từ giới thiệu:</span>
            <span className="text-blue-400 font-bold text-base">{user.total_referrals || 0}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-black/40 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${activeTab === 'profile'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-white/50 hover:text-white/70'
              }`}
          >
            👤 Thông tin
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${activeTab === 'rewards'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-white/50 hover:text-white/70'
              }`}
          >
            🎁 Đổi quà
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-4 text-center text-sm flex items-center justify-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl mb-4 text-center text-sm flex items-center justify-center gap-2">
            <span>✅</span> {success}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-200">
            {/* Basic Info Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-1.5 group">
                <label className="text-white/70 text-xs font-medium uppercase tracking-wider pl-1 group-focus-within:text-yellow-400 transition-colors">
                  Tên hiển thị
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập tên của bạn"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-yellow-400 focus:bg-white/10 focus:outline-none transition-all text-sm focus:shadow-[0_0_15px_rgba(250,204,21,0.1)]"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none group-focus-within:text-yellow-400 transition-colors">
                    ✎
                  </div>
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-1.5 group">
                <label className="text-white/70 text-xs font-medium uppercase tracking-wider pl-1 flex items-center justify-between group-focus-within:text-yellow-400 transition-colors">
                  <div className="flex items-center gap-2">
                    <span>Số điện thoại</span>
                    {!canAddPhone && (
                      <span className="text-white/30 text-[10px] normal-case font-normal tracking-normal">
                        (Đã xác thực - Không thể thay đổi)
                      </span>
                    )}
                  </div>
                  {canAddPhone && (
                    <span className="text-yellow-400 animate-pulse flex items-center gap-1">
                      <span>🎁</span> +3 lượt
                    </span>
                  )}
                </label>

                {canAddPhone ? (
                  <div className="space-y-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Nhập số điện thoại (10 số)"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-yellow-400/30 text-white placeholder-white/30 focus:border-yellow-400 focus:bg-white/10 focus:outline-none transition-all text-sm focus:shadow-[0_0_15px_rgba(250,204,21,0.1)]"
                      maxLength={10}
                    />
                    <p className="text-white/40 text-xs pl-1">
                      * Cập nhật SĐT để bảo vệ tài khoản và nhận quà.
                    </p>
                  </div>
                ) : (
                  <input
                    type="tel"
                    value={user.phone || ''}
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 cursor-not-allowed text-sm"
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-3 flex gap-3">
                {canAddPhone && phone.length >= 10 && (
                  <button
                    type="button"
                    onClick={handleAddPhone}
                    disabled={loading}
                    className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold rounded-xl hover:from-yellow-300 hover:to-yellow-400 disabled:opacity-50 transition-all transform active:scale-95 shadow-lg shadow-yellow-400/20 text-sm"
                  >
                    {loading ? 'ĐANG XỬ LÝ...' : '🎁 LƯU SĐT'}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading || name === user.name || !name.trim()}
                  className={`flex-1 py-3 font-bold rounded-xl transition-all active:scale-95 border text-sm ${name !== user.name && name.trim()
                    ? 'bg-green-600 border-green-600 text-white hover:bg-green-700 shadow-[0_0_15px_rgba(22,163,74,0.4)]'
                    : 'bg-white/5 text-white/30 border-white/5 cursor-not-allowed'
                    }`}
                >
                  {loading ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
                </button>
              </div>
            </form>

            {/* Referral Code Copy */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-white/70 text-xs mb-2">Mã giới thiệu của bạn:</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(user.referral_code)
                  setSuccess('Đã copy mã giới thiệu!')
                }}
                className="flex items-center justify-center gap-3 w-full bg-white/5 hover:bg-white/10 py-2 rounded-lg transition-all group"
              >
                <code className="text-blue-400 font-mono font-bold text-lg tracking-wider group-hover:text-blue-300">
                  {user.referral_code}
                </code>
                <span className="text-white/30 group-hover:text-white/70">📋</span>
              </button>
            </div>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={() => {
                  onClose()
                  onLogout()
                }}
                className="w-full py-3 text-red-400 font-medium text-sm hover:text-red-300 transition-colors flex items-center justify-center gap-2"
              >
                <span>🚪</span> Đăng xuất
              </button>
            )}
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
            <div className="text-center bg-gradient-to-br from-yellow-400/10 to-orange-500/10 rounded-2xl p-4 border border-yellow-400/20">
              <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Điểm hiện có</p>
              <p className="text-yellow-400 font-bold text-4xl">{user.total_score}</p>
            </div>

            {loadingRewards ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-white/50 text-sm">Đang tải quà tặng...</p>
              </div>
            ) : rewards.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-5xl mb-3 opacity-50">🎁</p>
                <p className="text-white/70 font-medium">Chưa có quà tặng nào</p>
                <p className="text-white/30 text-sm mt-1">Hãy quay lại sau nhé!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                        {reward.type === 'voucher' ? '🎟️' : '🎁'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold truncate">{reward.name}</h4>
                        <p className="text-white/50 text-xs line-clamp-2 mb-2">{reward.description}</p>

                        <div className="flex items-center justify-between">
                          {reward.type === 'voucher' && (
                            <span className="text-green-400 font-bold text-sm">
                              {reward.value.toLocaleString()}đ
                            </span>
                          )}
                          <span className="text-yellow-400 text-xs font-bold bg-yellow-400/10 px-2 py-1 rounded-md">
                            {reward.points_required} điểm
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRedeemReward(reward.id)}
                      disabled={
                        redeeming === reward.id ||
                        user.total_score < reward.points_required ||
                        reward.stock === 0
                      }
                      className={`w-full mt-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${user.total_score >= reward.points_required && reward.stock > 0
                        ? 'bg-white text-black hover:bg-gray-100 active:scale-95'
                        : 'bg-white/5 text-white/30 cursor-not-allowed'
                        }`}
                    >
                      {redeeming === reward.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                          <span>ĐANG ĐỔI...</span>
                        </>
                      ) : user.total_score < reward.points_required ? (
                        `Thiếu ${reward.points_required - user.total_score} điểm`
                      ) : reward.stock === 0 ? (
                        'Hết hàng'
                      ) : (
                        <>
                          <span>🎁</span> ĐỔI NGAY
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
