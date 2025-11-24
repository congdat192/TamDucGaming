'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'

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
  const [rewardCount, setRewardCount] = useState(0)

  useEffect(() => {
    const fetchRewardCount = async () => {
      try {
        const res = await fetch('/api/rewards/list')
        const data = await res.json()
        setRewardCount(data.rewards?.length || 0)
      } catch (error) {
        console.error('Failed to fetch reward count:', error)
      }
    }
    fetchRewardCount()
  }, [])

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
      <div className="max-w-md mx-auto flex justify-around items-center py-2 px-4">
        {/* Home Link */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all active:scale-95 ${pathname === '/'
            ? 'bg-yellow-400/20 text-yellow-400'
            : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
        >
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-medium">Trang chủ</span>
        </Link>

        {/* Leaderboard */}
        <Link
          href="/leaderboard"
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all active:scale-95 ${pathname === '/leaderboard' || pathname === '/leaderboard/all'
            ? 'bg-yellow-400/20 text-yellow-400'
            : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
        >
          <span className="text-xl">🏆</span>
          <span className="text-[10px] font-medium">Xếp hạng</span>
        </Link>

        {/* Gift */}
        <Link
          href="/gift"
          onClick={handleReferralClick}
          className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all active:scale-95 ${pathname === '/gift'
            ? 'bg-yellow-400/20 text-yellow-400'
            : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
        >
          <div className="relative">
            <span className="text-xl">🎁</span>
            {/* Badge */}
            {rewardCount > 0 && (
              <span className="absolute -top-2 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                {rewardCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Quà tặng</span>
        </Link>

        {/* Referral */}
        <Link
          href="/referral"
          onClick={handleReferralClick}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all active:scale-95 ${pathname === '/referral'
            ? 'bg-yellow-400/20 text-yellow-400'
            : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
        >
          <span className="text-xl">👥</span>
          <span className="text-[10px] font-medium">Giới thiệu</span>
        </Link>
      </div>
    </nav>
  )
}
