'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Snowflakes from '@/components/Snowflakes'
import BottomNavigation from '@/components/BottomNavigation'
import ProfileModal from '@/components/ProfileModal'

interface ReferralData {
  referralCode: string
  referralLink: string
  totalReferrals: number
  successfulReferrals: number
  bonusPlays: number
}

export default function ReferralPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReferralData | null>(null)
  const [copied, setCopied] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetchReferralData()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  }

  const fetchReferralData = async () => {
    try {
      const res = await fetch('/api/referral')
      if (!res.ok) {
        router.push('/')
        return
      }
      const referralData = await res.json()
      setData(referralData)
      checkAuth()
    } catch (error) {
      console.error('Failed to fetch referral data:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (data) {
      navigator.clipboard.writeText(data.referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopyCode = () => {
    if (data) {
      navigator.clipboard.writeText(data.referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    if (!data) return

    const shareData = {
      title: 'Santa Jump - Mắt Kính Tâm Đức',
      text: `🎅 Chơi Santa Jump nhận Voucher 500K! 🎁\n\nNhập mã giới thiệu: ${data.referralCode}\nhoặc click link bên dưới để cả 2 cùng nhận +5 lượt chơi!`,
      url: data.referralLink
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
        alert('Đã copy nội dung! Hãy gửi cho bạn bè nhé 🎁')
      }
    } catch (error) {
      console.log('Error sharing:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="text-white text-sm animate-pulse">Đang tải...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden pb-20 bg-[#0f172a]">
      <Snowflakes />

      {/* Header */}
      <header className="relative z-10 py-4 px-4 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 backdrop-blur-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-white">Mời Bạn Bè</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 py-6 space-y-5">

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a4d2e] via-[#1e5631] to-[#2d6a4f] p-6 text-center">
          {/* Decorative elements */}
          <div className="absolute top-2 left-4 text-4xl opacity-20 animate-bounce">🎁</div>
          <div className="absolute top-4 right-6 text-3xl opacity-20 animate-pulse">🎄</div>
          <div className="absolute bottom-2 left-8 text-2xl opacity-20">⭐</div>
          <div className="absolute bottom-4 right-4 text-3xl opacity-20 animate-bounce delay-150">🎅</div>

          {/* Main content */}
          <div className="relative z-10">
            <div className="text-5xl mb-3">👥</div>
            <h2 className="text-xl font-bold text-white mb-2">
              Mời bạn bè tham gia
            </h2>
            <div className="inline-flex items-center gap-2 bg-yellow-400/20 px-4 py-2 rounded-full border border-yellow-400/30">
              <span className="text-yellow-400 font-bold text-lg">+5 lượt chơi</span>
              <span className="text-2xl">🎮</span>
            </div>
            <p className="text-white/70 text-sm mt-3">
              Mỗi bạn bè xác thực SĐT = Bạn nhận ngay 5 lượt chơi bonus!
            </p>
          </div>
        </div>

        {/* Stats Card */}
        <div className="glass rounded-2xl p-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-xl">📨</span>
              </div>
              <div className="text-2xl font-bold text-white">{data?.totalReferrals || 0}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">Đã mời</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
              <div className="text-2xl font-bold text-green-400">{data?.successfulReferrals || 0}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">Thành công</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <span className="text-xl">🎮</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400">{data?.bonusPlays || 0}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">Lượt bonus</div>
            </div>
          </div>
        </div>

        {/* Referral Code Section */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
            <span>🎟️</span> Mã giới thiệu của bạn
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/10 rounded-xl px-4 py-3 border-2 border-dashed border-yellow-400/50">
              <div className="text-center">
                <span className="text-2xl font-bold text-yellow-400 tracking-widest font-mono">
                  {data?.referralCode}
                </span>
              </div>
            </div>
            <button
              onClick={handleCopyCode}
              className={`px-4 py-3 rounded-xl font-bold text-sm transition-all shrink-0 ${copied
                ? 'bg-green-500 text-white'
                : 'bg-yellow-400 text-black hover:bg-yellow-300'
                }`}
            >
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Share Link Section */}
        <div className="space-y-3">
          <div className="bg-white/5 rounded-2xl p-1 flex items-center gap-2 border border-white/10">
            <div className="flex-1 px-4 py-3 text-white/70 text-xs truncate font-mono">
              {data?.referralLink}
            </div>
            <button
              onClick={handleCopyLink}
              className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${copied
                ? 'bg-green-500 text-white'
                : 'bg-white text-black hover:bg-gray-100'
                }`}
            >
              {copied ? 'Đã Copy' : 'Copy Link'}
            </button>
          </div>

          <button
            onClick={handleShare}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-base rounded-2xl hover:from-green-400 hover:to-green-500 transition-all transform active:scale-95 shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
          >
            <span className="text-xl">📤</span> Chia sẻ ngay cho bạn bè
          </button>
        </div>

        {/* How it works */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <span>🎯</span> Cách nhận thưởng
          </h3>

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-blue-500/30">
                1
              </div>
              <div className="flex-1 pt-1">
                <p className="text-white text-sm font-medium">Chia sẻ mã hoặc link</p>
                <p className="text-white/50 text-xs mt-1">Gửi cho bạn bè qua Zalo, Messenger, Facebook...</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-purple-500/30">
                2
              </div>
              <div className="flex-1 pt-1">
                <p className="text-white text-sm font-medium">Bạn bè đăng ký & xác thực SĐT</p>
                <p className="text-white/50 text-xs mt-1">
                  Người được mời cần <span className="text-yellow-400 font-medium">xác thực số điện thoại</span> để hoàn tất
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-green-500/30">
                3
              </div>
              <div className="flex-1 pt-1">
                <p className="text-green-400 text-sm font-bold">Nhận ngay +5 lượt chơi! 🎉</p>
                <p className="text-white/50 text-xs mt-1">
                  Hệ thống tự động cộng lượt và thông báo qua email cho bạn
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-4">
          <div className="flex gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-yellow-400 font-bold text-sm">Mẹo: Mời càng nhiều, thưởng càng lớn!</p>
              <p className="text-white/60 text-xs mt-1">
                Không giới hạn số lượng bạn bè. Mời 10 người = 50 lượt chơi bonus!
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
        onUserUpdate={checkAuth}
        onLogout={async () => {
          await fetch('/api/auth/logout', { method: 'POST' })
          router.push('/')
        }}
      />

      {/* Bottom Navigation */}
      <BottomNavigation
        onProfileClick={() => setShowProfile(true)}
        isLoggedIn={true}
        showProfile={true}
      />
    </main>
  )
}
