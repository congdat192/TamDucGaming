'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import LoginModal from '@/components/LoginModal'
import ProfileModal from '@/components/ProfileModal'
import BottomNavigation from '@/components/BottomNavigation'
import Snowflakes from '@/components/Snowflakes'
import { useBGM } from '@/hooks/useBGM'
import TopMenu from '@/components/TopMenu'
import NotificationBell from '@/components/NotificationBell'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showLogin, setShowLogin] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Background music
  const bgm = useBGM('homepage')

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
    router.push('/')
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setIsLoggedIn(false)
      setUser(null)
      setShowProfile(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <main className="h-[100dvh] relative overflow-hidden flex flex-col">
      <Snowflakes />
      <TopMenu
        isLoggedIn={isLoggedIn}
        onProfileClick={() => setShowProfile(true)}
        onLoginClick={() => setShowLogin(true)}
        onLogoutClick={handleLogout}
      />

      {/* Notification Bell - Fixed top right */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationBell userId={user?.id} isLoggedIn={isLoggedIn} />
      </div>

      {/* Main scrollable area */}
      <div className="flex-1 overflow-y-auto pb-20 relative z-10">
        {/* Hero Section - fits in viewport */}
        <section className="min-h-[calc(100dvh-80px)] flex flex-col px-4 py-3">
          {/* Header - compact */}
          <header className="text-center flex-shrink-0">
            <div className="christmas-lights h-1 mb-2"></div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
              🎅 SANTA JUMP 🎄
            </h1>
            <p className="text-sm sm:text-lg text-yellow-300 font-semibold mt-1">
              Mắt Kính Tâm Đức
            </p>
          </header>

          {/* Game Card - flexible height */}
          <div className="flex-1 flex items-center justify-center py-3">
            <div className="glass rounded-2xl p-4 sm:p-6 max-w-md w-full">
              {/* Santa Icon + Title */}
              <div className="text-center mb-3">
                <div className="text-5xl sm:text-6xl mb-2">🎅</div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Nhảy Cùng Ông Già Noel!
                </h2>
                <p className="text-white/70 text-xs sm:text-sm mt-1">
                  Vượt chướng ngại vật, ghi điểm cao, nhận voucher!
                </p>
              </div>

              {/* Voucher Info - compact */}
              <div className="bg-white/10 rounded-xl p-3 mb-3">
                <h3 className="text-yellow-400 font-bold text-sm mb-2 text-center">🎁 VOUCHER THƯỞNG</h3>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white/5 rounded-lg py-2 px-1">
                    <div className="text-white/70">≥10 điểm</div>
                    <div className="text-green-400 font-bold">50K</div>
                  </div>
                  <div className="bg-white/5 rounded-lg py-2 px-1">
                    <div className="text-white/70">≥20 điểm</div>
                    <div className="text-yellow-400 font-bold">100K</div>
                  </div>
                  <div className="bg-white/5 rounded-lg py-2 px-1">
                    <div className="text-white/70">≥30 điểm</div>
                    <div className="text-red-400 font-bold">150K</div>
                  </div>
                </div>
              </div>

              {/* TOP Rankings - compact */}
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-3 mb-4 border border-yellow-500/30">
                <h3 className="text-yellow-400 font-bold text-sm mb-2 text-center">🏆 GIẢI THƯỞNG LỚN</h3>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-white/10 rounded-lg py-2 px-2">
                    <div className="text-white/70">TOP Tuần</div>
                    <div className="text-yellow-300 font-bold">5 Triệu</div>
                  </div>
                  <div className="bg-white/10 rounded-lg py-2 px-2">
                    <div className="text-white/70">TOP Tháng</div>
                    <div className="text-orange-400 font-bold">iPhone 17</div>
                  </div>
                </div>
              </div>

              {/* Play Button - always visible */}
              <button
                onClick={handlePlayClick}
                disabled={loading}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-lg sm:text-xl rounded-xl btn-glow disabled:opacity-50 transition-all"
              >
                {loading ? 'ĐANG TẢI...' : isLoggedIn ? '🎮 CHƠI NGAY' : '🎮 BẮT ĐẦU'}
              </button>

              {isLoggedIn && user && (
                <p className="text-green-300 mt-2 text-xs text-center">
                  Xin chào, {user.name || (user.email ? user.email.split('@')[0] : user.phone?.slice(0, 4) + '***')}
                </p>
              )}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="text-center flex-shrink-0 pb-2">
            <p className="text-white/40 text-xs animate-pulse">↓ Xem hướng dẫn</p>
          </div>
        </section>

        {/* How to Play - below the fold */}
        <section className="px-4 pb-8">
          <div className="glass rounded-2xl p-5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white mb-4 text-center">📖 Cách Chơi</h3>
            <ol className="space-y-3 text-white/80 text-sm">
              <li className="flex items-start gap-3">
                <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                <span>Đăng nhập bằng email</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                <span>Tap/Click để ông già Noel nhảy lên</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                <span>Tránh va chạm với ống khói</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                <span>Ghi điểm cao để nhận voucher!</span>
              </li>
            </ol>
          </div>

          {/* Footer */}
          <footer className="text-center py-6 text-white/40 text-xs">
            <p>© 2024 Mắt Kính Tâm Đức. All rights reserved.</p>
            <p className="mt-1">Chương trình Giáng Sinh 2024</p>
          </footer>
        </section>
      </div>

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
        onLogout={handleLogout}
      />

      {/* Bottom Navigation */}
      <BottomNavigation
        onProfileClick={() => setShowProfile(true)}
        onLoginClick={() => setShowLogin(true)}
        isLoggedIn={isLoggedIn}
        showProfile={true}
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
