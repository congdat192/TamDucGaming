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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a4d2e]/90 backdrop-blur-md border-t border-white/10 safe-area-bottom">
      <div className="max-w-md mx-auto flex justify-around items-center py-1 px-2">
        {/* Profile Button */}
        {showProfile && (
          <button
            onClick={handleProfileClick}
            className="flex flex-col items-center gap-0 px-2 py-0.5 rounded-lg transition-all text-white/70 hover:text-white hover:bg-white/10 active:scale-95"
          >
            <span className="text-lg">👤</span>
            <span className="text-[9px] font-medium">Hồ sơ</span>
          </button>
        )}

        {/* Leaderboard */}
        <Link
          href="/leaderboard"
          className={`flex flex-col items-center gap-0 px-2 py-0.5 rounded-lg transition-all active:scale-95 ${pathname === '/leaderboard' || pathname === '/leaderboard/all'
            ? 'bg-yellow-400/20 text-yellow-400'
            : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
        >
          <span className="text-lg">🏆</span>
          <span className="text-[9px] font-medium">Xếp hạng</span>
        </Link>

        {/* Rules */}
        <Link
          href="/rules"
          className={`flex flex-col items-center gap-0 px-2 py-0.5 rounded-lg transition-all active:scale-95 ${pathname === '/rules'
            ? 'bg-yellow-400/20 text-yellow-400'
            : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
        >
          <span className="text-lg">📜</span>
          <span className="text-[9px] font-medium">Thể lệ</span>
        </Link>

        {/* Referral */}
        <Link
          href="/referral"
          onClick={handleReferralClick}
          className={`flex flex-col items-center gap-0 px-2 py-0.5 rounded-lg transition-all active:scale-95 ${pathname === '/referral'
            ? 'bg-yellow-400/20 text-yellow-400'
            : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
        >
          <span className="text-lg">🎁</span>
          <span className="text-[9px] font-medium">Giới thiệu</span>
        </Link>
      </div>
    </nav>
  )
}
