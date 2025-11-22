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

  const handleShare = async () => {
    if (!data) return

    const shareData = {
      title: 'Santa Jump - Mắt Kính Tâm Đức',
      text: '🎅 Chơi Santa Jump nhận Voucher 500K! 🎁\nNhập mã của tớ để cả 2 cùng nhận thêm lượt chơi nhé:',
      url: data.referralLink
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
        // Show a more subtle notification or keep alert if no toast component
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
      <div className="relative z-10 max-w-md mx-auto px-4 py-6 space-y-6">

        {/* Stats Card */}
        <div className="glass rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="text-6xl">🎁</span>
          </div>
          <h2 className="text-white/70 text-sm font-medium mb-4">Thống kê giới thiệu</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">{data?.totalReferrals || 0}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">Đã mời</div>
            </div>
            <div className="text-center border-l border-white/10 border-r">
              <div className="text-2xl font-bold text-green-400 mb-1">{data?.successfulReferrals || 0}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">Thành công</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">{data?.bonusPlays || 0}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">Bonus</div>
            </div>
          </div>
        </div>

        {/* Share Section */}
        <div className="space-y-4">
          <div className="bg-white/5 rounded-2xl p-1 flex items-center gap-2 border border-white/10">
            <div className="flex-1 px-4 py-3 text-white/90 text-sm truncate font-mono">
              {data?.referralLink}
            </div>
            <button
              onClick={handleCopyLink}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${copied
                ? 'bg-green-500 text-white'
                : 'bg-white text-black hover:bg-gray-100'
                }`}
            >
              {copied ? 'Đã Copy' : 'Copy'}
            </button>
          </div>

          <button
            onClick={handleShare}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold text-base rounded-2xl hover:from-yellow-300 hover:to-yellow-400 transition-all transform active:scale-95 shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-2"
          >
            <span>📤</span> Chia sẻ ngay
          </button>
        </div>

        {/* Rules Section */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <span>ℹ️</span> Quy tắc nhận thưởng
          </h3>

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0">1</div>
              <div>
                <p className="text-white text-sm font-medium">Gửi link giới thiệu</p>
                <p className="text-white/50 text-xs mt-1">Copy link phía trên và gửi cho bạn bè của bạn.</p>
              </div>
            </div>

            <div className="w-0.5 h-4 bg-white/10 ml-4"></div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0">2</div>
              <div>
                <p className="text-white text-sm font-medium">Bạn bè tham gia & xác thực</p>
                <p className="text-white/50 text-xs mt-1">
                  Người được mời cần đăng ký, <span className="text-yellow-400">xác thực số điện thoại</span> và hoàn thành lượt chơi đầu tiên.
                </p>
              </div>
            </div>

            <div className="w-0.5 h-4 bg-white/10 ml-4"></div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-sm shrink-0">3</div>
              <div>
                <p className="text-green-400 text-sm font-bold">Nhận thưởng +1 lượt chơi</p>
                <p className="text-white/50 text-xs mt-1">
                  Hệ thống sẽ tự động cộng lượt chơi và gửi email thông báo cho bạn.
                </p>
              </div>
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
