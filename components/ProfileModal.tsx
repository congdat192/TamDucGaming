'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  phone: string | null
  email: string | null
  name: string | null
  total_score: number
  bonus_plays: number
  referral_code: string
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="relative bg-gradient-to-b from-green-800 to-green-900 rounded-3xl p-6 max-w-md w-full border-4 border-yellow-400 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl w-8 h-8 flex items-center justify-center"
        >
          ✕
        </button>

        {/* Header - Avatar trái, thông tin phải */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-3xl">🎅</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">
              {name || displayName}
            </h2>
            <p className="text-white/70 text-sm">
              📱 {user.phone || 'Chưa cập nhật SĐT'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mb-4 bg-black/20 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'profile'
                ? 'bg-yellow-400 text-green-900'
                : 'text-white/70 hover:text-white'
            }`}
          >
            👤 Thông tin
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'rewards'
                ? 'bg-yellow-400 text-green-900'
                : 'text-white/70 hover:text-white'
            }`}
          >
            🎁 Đổi quà
          </button>
        </div>

        {/* Stats Bar */}
        <div className="flex justify-around bg-black/20 rounded-xl p-3 mb-4">
          <div className="text-center">
            <p className="text-yellow-400 font-bold text-xl">{user.total_score}</p>
            <p className="text-white/70 text-xs">Tổng điểm</p>
          </div>
          <div className="text-center">
            <p className="text-green-400 font-bold text-xl">{user.bonus_plays}</p>
            <p className="text-white/70 text-xs">Lượt bonus</p>
          </div>
          <div className="text-center">
            <p className="text-blue-400 font-bold text-sm">{user.referral_code}</p>
            <p className="text-white/70 text-xs">Mã giới thiệu</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded-lg mb-4 text-center text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-2 rounded-lg mb-4 text-center text-sm">
            {success}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* Basic Info Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-3">
              {/* Email Field - Read Only */}
              {user.email && (
                <div>
                  <label className="block text-white mb-1 text-sm font-semibold">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border-2 border-white/20 text-white/70 cursor-not-allowed"
                  />
                </div>
              )}

              {/* Name Field */}
              <div>
                <label className="block text-white mb-1 text-sm font-semibold">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên của bạn"
                  className="w-full px-4 py-2 rounded-xl bg-white/10 border-2 border-white/30 text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none"
                />
              </div>

              {/* Phone Field - with bonus incentive if missing */}
              <div>
                <label className="block text-white mb-1 text-sm font-semibold flex items-center gap-2">
                  Số điện thoại
                  {canAddPhone && (
                    <span className="text-yellow-400 text-xs font-normal animate-pulse">
                      🎁 +3 lượt chơi!
                    </span>
                  )}
                </label>

                {canAddPhone ? (
                  <>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Nhập số điện thoại (VD: 0912345678)"
                      className="w-full px-4 py-2 rounded-xl bg-white/10 border-2 border-yellow-400/50 text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none"
                      maxLength={10}
                    />
                    <p className="text-yellow-400/80 text-xs mt-1">
                      💡 Cập nhật số điện thoại để nhận thêm 3 lượt chơi miễn phí!
                    </p>
                  </>
                ) : (
                  <input
                    type="tel"
                    value={user.phone || ''}
                    disabled
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border-2 border-white/20 text-white/70 cursor-not-allowed"
                  />
                )}
              </div>

              {/* Save Buttons */}
              <div className="space-y-2">
                {canAddPhone && phone.length >= 10 && (
                  <button
                    type="button"
                    onClick={handleAddPhone}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 transition-all transform hover:scale-[1.02]"
                  >
                    {loading ? 'ĐANG XỬ LÝ...' : '🎁 LƯU SĐT & NHẬN 3 LƯỢT CHƠI'}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || name === user.name}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all"
                >
                  {loading ? 'ĐANG LƯU...' : '💾 LƯU TÊN HIỂN THỊ'}
                </button>
              </div>
            </form>

            {/* Referral Code Copy */}
            <div className="bg-black/20 rounded-xl p-3 text-center">
              <p className="text-white/70 text-xs mb-1">Chia sẻ mã giới thiệu để nhận thêm lượt:</p>
              <div className="flex items-center justify-center gap-2">
                <code className="bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-lg font-mono font-bold">
                  {user.referral_code}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user.referral_code)
                    setSuccess('Đã copy mã giới thiệu!')
                  }}
                  className="text-yellow-400 hover:text-yellow-300 text-sm"
                >
                  📋
                </button>
              </div>
            </div>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={() => {
                  onClose()
                  onLogout()
                }}
                className="w-full py-3 bg-red-500/20 border border-red-500 text-red-400 font-bold rounded-xl hover:bg-red-500/30 transition-all"
              >
                🚪 ĐĂNG XUẤT
              </button>
            )}
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-4">
            <div className="text-center bg-black/20 rounded-xl p-3">
              <p className="text-white/70 text-sm">Điểm hiện có</p>
              <p className="text-yellow-400 font-bold text-3xl">{user.total_score}</p>
            </div>

            {loadingRewards ? (
              <div className="text-center py-8">
                <p className="text-white/70">Đang tải quà tặng...</p>
              </div>
            ) : rewards.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">🎁</p>
                <p className="text-white/70">Chưa có quà tặng nào</p>
                <p className="text-white/50 text-sm">Quay lại sau nhé!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="bg-white/10 rounded-xl p-4 border border-white/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">
                        {reward.type === 'voucher' ? '🎟️' : '🎁'}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold">{reward.name}</h4>
                        <p className="text-white/70 text-sm">{reward.description}</p>
                        {reward.type === 'voucher' && (
                          <p className="text-green-400 font-bold">
                            Giá trị: {reward.value.toLocaleString()}đ
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-yellow-400 text-sm">
                            🏆 {reward.points_required} điểm
                          </span>
                          {reward.stock > 0 ? (
                            <span className="text-white/50 text-xs">
                              Còn {reward.stock} phần
                            </span>
                          ) : (
                            <span className="text-red-400 text-xs">Hết hàng</span>
                          )}
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
                      className={`w-full mt-3 py-2 rounded-lg font-bold transition-all ${
                        user.total_score >= reward.points_required && reward.stock > 0
                          ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {redeeming === reward.id
                        ? 'ĐANG ĐỔI...'
                        : user.total_score < reward.points_required
                        ? `Cần thêm ${reward.points_required - user.total_score} điểm`
                        : reward.stock === 0
                        ? 'Hết hàng'
                        : '🎁 ĐỔI NGAY'}
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
