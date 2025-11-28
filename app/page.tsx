'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import LoginModal from '@/components/LoginModal'
import ProfileModal from '@/components/ProfileModal'
import BottomNavigation from '@/components/BottomNavigation'
import FloatingAudioToggle from '@/components/FloatingAudioToggle'
import Snowflakes from '@/components/Snowflakes'
import { useBGM } from '@/hooks/useBGM'
import TopMenu from '@/components/TopMenu'
import NotificationBell from '@/components/NotificationBell'
import GiftSection from '@/components/GiftSection'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showLogin, setShowLogin] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // User stats derived from user object
  const [maxPlays, setMaxPlays] = useState<number>(3)

  // Background music
  const bgm = useBGM('homepage')

  // Fetch config for maxPlays
  useEffect(() => {
    fetch('/api/config/public')
      .then(res => res.json())
      .then(data => {
        if (data.config?.maxPlaysPerDay) {
          setMaxPlays(data.config.maxPlaysPerDay)
        }
      })
      .catch(err => console.error('Failed to load config:', err))
  }, [])

  const referralCode = searchParams.get('ref')

  useEffect(() => {
    checkAuth()
    const ref = searchParams.get('ref')
    if (ref) {
      localStorage.setItem('referralCode', ref)
    }
  }, [searchParams])

  useEffect(() => {
    if (isLoggedIn) {
      // Refetch user data when page becomes visible (user returns from game)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          checkAuth()
        }
      }

      const handleFocus = () => {
        checkAuth()
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('focus', handleFocus)

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('focus', handleFocus)
      }
    }
  }, [isLoggedIn])

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
    // router.push('/') // Removed to prevent state reset/remount
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

  // Calculate plays remaining based on user data (same logic as ProfileModal)
  const playsRemaining = user ? Math.max(0, maxPlays - (user.plays_today || 0)) + (user.bonus_plays || 0) : 0

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
            {/* User greeting - shown when logged in */}
            {isLoggedIn && user && (
              <p className="text-green-300 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-500">
                👋 Xin chào, {user.name || (user.email ? user.email.split('@')[0] : user.phone?.slice(0, 4) + '***')}
              </p>
            )}
            <p className="text-sm sm:text-lg text-yellow-300 font-semibold mt-1">
              Mắt Kính Tâm Đức
            </p>
          </header>

          {/* Game Card - flexible height */}
          <div className="flex-1 flex items-center justify-center py-3">
            <div className="glass rounded-2xl p-4 sm:p-6 max-w-md w-full">
              {/* Santa Icon + Title */}
              <div className="text-center mb-3">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Nhảy Cùng Ông Già Noel!
                </h2>
                <p className="text-white/70 text-xs sm:text-sm mt-1">
                  Vượt chướng ngại vật, ghi điểm cao, nhận voucher!
                </p>
              </div>

              {/* Voucher Info - compact */}
              <div className="bg-white/10 rounded-xl p-3 mb-3">
                <h3 className="text-yellow-400 font-bold text-sm mb-3 text-center uppercase tracking-wider">
                  🎁 Tích Điểm Đổi Quà
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  {/* Tier 1 */}
                  <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col justify-between h-full relative group">
                    <div className="text-white font-bold text-sm mb-1">10 điểm</div>
                    <div className="text-[10px] text-white/40 mb-1">Đổi voucher</div>
                    <div className="text-green-400 font-bold text-sm bg-green-400/10 rounded py-1 mb-1">50K</div>
                    {isLoggedIn && (user?.total_score || 0) >= 10 && (
                      <Link href="/gift" className="block w-full py-1 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold rounded animate-pulse mt-1">
                        Đổi ngay
                      </Link>
                    )}
                  </div>

                  {/* Tier 2 */}
                  <div className="bg-white/5 rounded-lg p-2 border border-yellow-500/20 relative overflow-hidden flex flex-col justify-between h-full group">
                    <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-500/50 rounded-bl-lg"></div>
                    <div className="text-white font-bold text-sm mb-1">20 điểm</div>
                    <div className="text-[10px] text-white/40 mb-1">Đổi voucher</div>
                    <div className="text-yellow-400 font-bold text-sm bg-yellow-400/10 rounded py-1 mb-1">100K</div>
                    {isLoggedIn && (user?.total_score || 0) >= 20 && (
                      <Link href="/gift" className="block w-full py-1 bg-yellow-500 hover:bg-yellow-600 text-black text-[10px] font-bold rounded animate-pulse mt-1">
                        Đổi ngay
                      </Link>
                    )}
                  </div>

                  {/* Tier 3 */}
                  <div className="bg-gradient-to-b from-red-500/20 to-transparent rounded-lg p-2 border border-red-500/30 flex flex-col justify-between h-full group">
                    <div className="text-white font-bold text-sm mb-1">30 điểm</div>
                    <div className="text-[10px] text-white/40 mb-1">Đổi voucher</div>
                    <div className="text-red-400 font-bold text-sm bg-red-400/10 rounded py-1 mb-1">150K</div>
                    {isLoggedIn && (user?.total_score || 0) >= 30 && (
                      <Link href="/gift" className="block w-full py-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded animate-pulse mt-1">
                        Đổi ngay
                      </Link>
                    )}
                  </div>
                </div>

                {/* More Gifts Link */}
                <div className="text-center">
                  <Link href="/gift" className="inline-flex items-center gap-1 text-xs text-yellow-300 hover:text-yellow-200 transition-colors">
                    <span>🎁 Xem thêm kho quà đổi thưởng</span>
                    <span>→</span>
                  </Link>
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

              {/* Stats Bar - shown when logged in */}
              {isLoggedIn && user && (
                <div className="flex items-center justify-center gap-3 text-xs text-white/80 mt-3 bg-white/5 rounded-lg py-2 px-3">
                  <span className="flex items-center gap-1">
                    <span>📊</span>
                    <span>Còn</span>
                    <span className="font-semibold text-yellow-300">{playsRemaining}</span>
                    <span>lượt</span>
                  </span>
                  <span className="text-white/30">|</span>
                  <span className="flex items-center gap-1">
                    <span>🏅</span>
                    <span>Tổng điểm:</span>
                    <span className="font-semibold text-green-300">{user.total_score || 0}</span>
                    <span>đ</span>
                  </span>
                </div>
              )}

              {/* Terms & Conditions */}
              <p className="text-white/50 text-xs text-center mt-3 leading-relaxed">
                Bằng việc tham gia chơi game, bạn đồng ý với{' '}
                <Link href="/policy" className="text-yellow-400 hover:text-yellow-300 underline">
                  Điều kiện & Điều khoản
                </Link>
                {' '}của chúng tôi
              </p>
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

          {/* Footer removed from here */}
        </section>

        {/* Gift Section - Full content */}
        <section className="px-4 pb-20">
          <div className="text-center mb-6">
            <div className="christmas-lights h-1 mb-2"></div>
            <h2 className="text-2xl font-bold text-white drop-shadow-lg uppercase tracking-wide">
              🎁 Kho Quà Đổi Thưởng
            </h2>
            <p className="text-white/60 text-sm mt-1">Tích điểm đổi quà ngay!</p>
          </div>

          <GiftSection
            user={user}
            isLoggedIn={isLoggedIn}
            onRedeemSuccess={() => {
              checkAuth()
            }}
          />

          {/* Footer - Moved to bottom */}
          <footer className="text-center py-6 text-white/40 text-xs mt-8 border-t border-white/5 pt-8">
            <p>© 2025 Mắt Kính Tâm Đức. All rights reserved.</p>
            <p className="mt-1">Chương trình Giáng Sinh 2025</p>
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
        onUserUpdate={() => {
          checkAuth()
        }}
        onLogout={handleLogout}
      />

      {/* Bottom Navigation */}
      <FloatingAudioToggle />
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
