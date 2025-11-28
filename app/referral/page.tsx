'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Snowflakes from '@/components/Snowflakes'
import BottomNavigation from '@/components/BottomNavigation'
import FloatingAudioToggle from '@/components/FloatingAudioToggle'
import ProfileModal from '@/components/ProfileModal'

interface ReferralHistoryItem {
  id: string
  phone: string
  date: string
  status: 'success' | 'pending'
  reward: string
}

interface ReferralData {
  referralCode: string
  referralLink: string
  totalReferrals: number
  successfulReferrals: number
  bonusPlays: number
  history: ReferralHistoryItem[]
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
    <main className="min-h-screen relative pb-24 bg-[#0f172a]">
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
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
            Mời Bạn Bè
          </h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 py-6 space-y-6">

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a4d2e] via-[#0f3923] to-[#0a2615] p-6 text-center border border-white/10 shadow-2xl shadow-green-900/20">
          {/* Decorative elements */}
          <div className="absolute top-2 left-4 text-4xl opacity-30 animate-bounce-slow">🎁</div>
          <div className="absolute top-4 right-6 text-3xl opacity-30 animate-pulse">🎄</div>
          <div className="absolute bottom-2 left-8 text-2xl opacity-30 animate-spin-slow">⭐</div>
          <div className="absolute bottom-4 right-4 text-3xl opacity-30 animate-bounce delay-150">🎅</div>

          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-50"></div>

          {/* Main content */}
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-yellow-400/30">
              <span className="text-3xl drop-shadow-lg">📨</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 drop-shadow-md">
              Mời bạn bè tham gia
            </h2>
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 px-6 py-3 rounded-2xl border border-yellow-400/40 backdrop-blur-md shadow-lg shadow-yellow-500/10">
              <span className="text-yellow-400 font-bold text-xl drop-shadow">+5 lượt chơi</span>
              <span className="text-2xl animate-pulse">🎮</span>
            </div>
            <p className="text-white/80 text-sm mt-4 font-medium leading-relaxed">
              Mỗi bạn bè xác thực SĐT thành công<br />
              <span className="text-yellow-400">Bạn nhận ngay 5 lượt chơi bonus!</span>
            </p>
          </div>
        </div>

        {/* Stats Card */}
        <div className="glass rounded-2xl p-4 border border-white/10 bg-white/5">
          <div className="grid grid-cols-3 gap-4 divide-x divide-white/10">
            <div className="text-center px-1">
              <div className="text-xl font-bold text-white">{data?.totalReferrals || 0}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider font-medium">Đã mời</div>
            </div>
            <div className="text-center px-1">
              <div className="text-xl font-bold text-green-400">{data?.successfulReferrals || 0}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider font-medium">Thành công</div>
            </div>
            <div className="text-center px-1">
              <div className="text-xl font-bold text-yellow-400">{data?.bonusPlays || 0}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider font-medium">Lượt bonus</div>
            </div>
          </div>
        </div>

        {/* Share Link Section */}
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => {
              if (!data) return
              // Use sharer.php for feed post
              const url = encodeURIComponent(data.referralLink)
              const quote = encodeURIComponent(`Chơi Santa Jump nhận quà 500K! Mã: ${data.referralCode}`)
              window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, '_blank', 'width=600,height=400')
            }}
            className="py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Đăng Facebook
          </button>
        </div>

        <button
          onClick={handleShare}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm shadow-lg shadow-cyan-500/20"
        >
          <div className="flex -space-x-2 mr-1">
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center z-10 border border-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0084FF" className="w-4 h-4">
                <path d="M12 2C6.48 2 2 6.03 2 11C2 13.66 3.39 16.04 5.55 17.59C5.67 17.68 5.72 17.84 5.69 17.99L5.23 20.82C5.16 21.23 5.6 21.56 5.97 21.34L8.92 19.7C9.04 19.63 9.18 19.62 9.31 19.66C10.17 19.88 11.07 20 12 20C17.52 20 22 15.97 22 11C22 6.03 17.52 2 12 2ZM13.85 14.15L11.65 11.8L7.4 14.15L12.15 9L14.35 11.35L18.6 9L13.85 14.15Z" />
              </svg>
            </div>
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-blue-500">
              <span className="text-[#0068FF] font-black text-[10px]">Z</span>
            </div>
          </div>
          Mời qua tin nhắn
        </button>

        <div className="bg-black/20 rounded-2xl p-1.5 flex items-center gap-2 border border-white/10">
          <div className="flex-1 px-4 py-3 text-white/60 text-xs truncate font-mono">
            {data?.referralLink}
          </div>
          <button
            onClick={handleCopyLink}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${copied
              ? 'bg-green-500/20 text-green-400'
              : 'bg-white/10 text-white hover:bg-white/20'
              }`}
          >
            {copied ? 'Đã Copy' : 'Copy Link'}
          </button>
        </div>

        {/* How it works */}
        <div className="glass rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-wide opacity-80">
            <span>🎯</span> Cách nhận lượt chơi
          </h3>

          <div className="space-y-6 relative">
            {/* Connecting line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-white/10"></div>

            <div className="flex gap-4 items-start relative z-10">
              <div className="w-10 h-10 rounded-full bg-[#0f172a] border-2 border-blue-500 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                1
              </div>
              <div className="flex-1 pt-1">
                <p className="text-white text-sm font-bold mb-1">Chia sẻ mã hoặc link</p>
                <p className="text-white/50 text-xs leading-relaxed">Gửi cho bạn bè qua Zalo, Messenger, Facebook...</p>
              </div>
            </div>

            <div className="flex gap-4 items-start relative z-10">
              <div className="w-10 h-10 rounded-full bg-[#0f172a] border-2 border-purple-500 flex items-center justify-center text-purple-400 font-bold text-sm shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                2
              </div>
              <div className="flex-1 pt-1">
                <p className="text-white text-sm font-bold mb-1">Bạn bè đăng ký & xác thực</p>
                <p className="text-white/50 text-xs leading-relaxed">
                  Người được mời cần <span className="text-yellow-400 font-medium">xác thực số điện thoại</span> để hoàn tất
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start relative z-10">
              <div className="w-10 h-10 rounded-full bg-[#0f172a] border-2 border-green-500 flex items-center justify-center text-green-400 font-bold text-sm shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                3
              </div>
              <div className="flex-1 pt-1">
                <p className="text-green-400 text-sm font-bold mb-1">Nhận ngay +5 lượt chơi! 🎉</p>
                <p className="text-white/50 text-xs leading-relaxed">
                  Hệ thống tự động cộng lượt và thông báo qua email cho bạn
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-400/30 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-6xl opacity-5 rotate-12">💡</div>
          <div className="flex gap-4 items-center relative z-10">
            <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center shrink-0">
              <span className="text-xl">💡</span>
            </div>
            <div>
              <p className="text-yellow-400 font-bold text-sm mb-0.5">Mẹo: Mời càng nhiều, nhận lượt không giới hạn!</p>
              <p className="text-white/60 text-xs">
                Không giới hạn số lượng. Mời 10 người = 50 lượt chơi bonus!
              </p>
            </div>
          </div>
        </div>

        {/* Referral History */}
        <div className="glass rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide opacity-80">
            <span>📜</span> Lịch sử giới thiệu
          </h3>

          {data?.history && data.history.length > 0 ? (
            <div className="space-y-3">
              {data.history.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white text-lg">
                      👤
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{item.phone}</p>
                      <p className="text-white/40 text-xs">
                        {new Date(item.date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${item.status === 'success' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                      {item.reward}
                    </div>
                    <div className={`text-[10px] uppercase tracking-wide ${item.status === 'success' ? 'text-green-400/50' : 'text-yellow-400/50'
                      }`}>
                      {item.status === 'success' ? 'Thành công' : 'Chờ xác thực'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/40">
              <div className="text-4xl mb-2 opacity-50">📭</div>
              <p className="text-sm">Chưa có ai tham gia</p>
              <p className="text-xs mt-1">Hãy mời bạn bè ngay nhé!</p>
            </div>
          )}
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
      <FloatingAudioToggle />
      <BottomNavigation
        onProfileClick={() => setShowProfile(true)}
        isLoggedIn={true}
        showProfile={true}
      />
    </main>
  )
}
