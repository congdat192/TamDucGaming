'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import LoginModal from '@/components/LoginModal'
import ProfileModal from '@/components/ProfileModal'
import Snowflakes from '@/components/Snowflakes'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showLogin, setShowLogin] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const referralCode = searchParams.get('ref')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setIsLoggedIn(true)
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayClick = () => {
    if (isLoggedIn) {
      router.push('/game')
    } else {
      setShowLogin(true)
    }
  }

  const handleLoginSuccess = () => {
    setIsLoggedIn(true)
    checkAuth()
    router.push('/game')
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <Snowflakes />

      {/* Header */}
      <header className="relative z-10 pt-8 pb-4 text-center">
        {/* Profile Icon - Top Left */}
        {isLoggedIn && user && (
          <button
            onClick={() => setShowProfile(true)}
            className="absolute top-4 left-4 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all border-2 border-yellow-400"
            title="Hồ sơ của tôi"
          >
            <span className="text-2xl">👤</span>
          </button>
        )}

        <div className="christmas-lights h-1 mb-4"></div>
        <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg mb-2">
          🎅 SANTA JUMP 🎄
        </h1>
        <p className="text-xl md:text-2xl text-yellow-300 font-semibold">
          Mắt Kính Tâm Đức
        </p>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-8">
        {/* Game Preview Card */}
        <div className="glass rounded-3xl p-8 max-w-md w-full text-center mb-8">
          <div className="text-8xl mb-4 animate-bounce">🎅</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Nhảy Cùng Ông Già Noel!
          </h2>
          <p className="text-green-200 mb-6">
            Điều khiển ông già Noel vượt qua chướng ngại vật,
            ghi điểm cao và nhận voucher hấp dẫn!
          </p>

          {/* Voucher Info */}
          <div className="bg-white/10 rounded-xl p-4 mb-6">
            <h3 className="text-yellow-400 font-bold mb-3">🎁 VOUCHER THƯỞNG</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white">
                <span>≥ 10 điểm</span>
                <span className="text-green-400 font-bold">50.000đ</span>
              </div>
              <div className="flex justify-between text-white">
                <span>≥ 20 điểm</span>
                <span className="text-yellow-400 font-bold">100.000đ</span>
              </div>
              <div className="flex justify-between text-white">
                <span>≥ 30 điểm</span>
                <span className="text-red-400 font-bold">150.000đ</span>
              </div>
            </div>
          </div>

          {/* Play Button */}
          <button
            onClick={handlePlayClick}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-2xl rounded-xl btn-glow disabled:opacity-50 transition-all"
          >
            {loading ? 'ĐANG TẢI...' : isLoggedIn ? '🎮 CHƠI NGAY' : '🎮 BẮT ĐẦU'}
          </button>

          {isLoggedIn && user && (
            <p className="text-green-300 mt-4 text-sm">
              Xin chào, {user.name || (user.email ? user.email.split('@')[0] : user.phone?.slice(0, 4) + '***')}
            </p>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex gap-4 flex-wrap justify-center">
          <a
            href="/leaderboard"
            className="px-6 py-3 bg-yellow-500/20 border border-yellow-500 text-yellow-400 rounded-full hover:bg-yellow-500/30 transition-all"
          >
            🏆 Bảng Xếp Hạng
          </a>
          {isLoggedIn && (
            <button
              onClick={() => router.push('/referral')}
              className="px-6 py-3 bg-green-500/20 border border-green-500 text-green-400 rounded-full hover:bg-green-500/30 transition-all"
            >
              👥 Giới Thiệu Bạn
            </button>
          )}
        </div>

        {/* How to Play */}
        <div className="mt-8 glass rounded-2xl p-6 max-w-md w-full">
          <h3 className="text-xl font-bold text-white mb-4 text-center">📖 Cách Chơi</h3>
          <ol className="space-y-3 text-green-200 text-sm">
            <li className="flex items-start gap-2">
              <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs">1</span>
              <span>Đăng nhập bằng số điện thoại</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs">2</span>
              <span>Tap/Click để ông già Noel nhảy lên</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs">3</span>
              <span>Tránh va chạm với ống khói</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs">4</span>
              <span>Ghi điểm cao để nhận voucher!</span>
            </li>
          </ol>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-white/60 text-sm">
        <p>© 2024 Mắt Kính Tâm Đức. All rights reserved.</p>
        <p className="mt-1">Chương trình Giáng Sinh 2024</p>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={handleLoginSuccess}
        referralCode={referralCode || undefined}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
        onUserUpdate={checkAuth}
      />
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-blue-950">
        <div className="text-white text-2xl">Đang tải...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
