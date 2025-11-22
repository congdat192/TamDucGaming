'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface BottomNavigationProps {
  onProfileClick?: () => void
  onLoginClick?: () => void  // Khi chưa đăng nhập mà click profile/referral
  isLoggedIn?: boolean
  showProfile?: boolean
}

export default function BottomNavigation({
  onProfileClick,
  onLoginClick,
  isLoggedIn = true,
  showProfile = true
}: BottomNavigationProps) {
  const pathname = usePathname()

  const handleProfileClick = () => {
    if (isLoggedIn) {
      onProfileClick?.()
    } else {
      onLoginClick?.()
    }
  }

  const handleReferralClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault()
      onLoginClick?.()
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-green-900/95 to-green-800/95 backdrop-blur-md border-t-2 border-yellow-400/50 safe-area-bottom">
      <div className="max-w-md mx-auto flex justify-around items-center py-2 px-4">
        {/* Profile Button */}
        {showProfile && (
          <button
            onClick={handleProfileClick}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all text-white/70 hover:text-white hover:bg-white/10"
          >
            <span className="text-2xl">👤</span>
            <span className="text-xs font-semibold">Hồ sơ</span>
          </button>
        )}

        {/* Leaderboard - Always accessible */}
        <Link
          href="/leaderboard"
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
            pathname === '/leaderboard'
              ? 'bg-yellow-400/20 text-yellow-400'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <span className="text-2xl">🏆</span>
          <span className="text-xs font-semibold">Xếp hạng</span>
        </Link>

        {/* Referral - Requires login */}
        <Link
          href="/referral"
          onClick={handleReferralClick}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
            pathname === '/referral'
              ? 'bg-yellow-400/20 text-yellow-400'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <span className="text-2xl">🎁</span>
          <span className="text-xs font-semibold">Mời bạn</span>
        </Link>
      </div>
    </nav>
  )
}
