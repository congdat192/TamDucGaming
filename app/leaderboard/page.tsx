'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Snowflakes from '@/components/Snowflakes'
import BottomNavigation from '@/components/BottomNavigation'
import ProfileModal from '@/components/ProfileModal'
import { useBGM } from '@/hooks/useBGM'

interface LeaderboardEntry {
  rank: number
  phone: string | null
  email: string | null
  totalScore: number
  gamesPlayed: number
}

interface Campaign {
  id: string
  name: string
  start_date: string
  end_date: string
}

type Period = 'week' | 'month' | 'all'

export default function LeaderboardPage() {
  const router = useRouter()

  // Background music
  const bgm = useBGM('leaderboard')
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [period, setPeriod] = useState<Period>('all')
  const [showProfile, setShowProfile] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const maxItems = 30

  useEffect(() => {
    fetchLeaderboard()
    checkAuth()

    // Polling every 60 seconds
    const interval = setInterval(() => {
      fetchLeaderboard(true)
    }, 60000)

    return () => clearInterval(interval)
  }, [period])

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
    }
  }

  const fetchLeaderboard = async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    try {
      let url = `/api/leaderboard?period=${period}&limit=${maxItems}`

      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()

      setLeaderboard(data.leaderboard || [])
      setCampaigns(data.campaigns || [])
      if (!isBackground) setCurrentPage(1) // Reset to page 1 only on initial fetch
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      if (!isBackground) setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500 to-yellow-600'
      case 2: return 'bg-gradient-to-r from-gray-400 to-gray-500'
      case 3: return 'bg-gradient-to-r from-orange-600 to-orange-700'
      default: return 'bg-white/10'
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(Math.min(leaderboard.length, maxItems) / itemsPerPage)
  const currentData = leaderboard.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <main className="min-h-screen relative overflow-hidden pb-20">
      <Snowflakes />

      {/* Header */}
      <header className="relative z-10 py-4 px-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 backdrop-blur-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">🏆 Bảng Xếp Hạng</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 py-4">
        <div className="glass rounded-3xl p-4 max-w-md w-full">
          {/* Period Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar justify-center">
            {(['all', 'week', 'month'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${period === p
                  ? 'bg-yellow-500 text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
              >
                {p === 'all' && 'Tất cả'}
                {p === 'week' && 'Tuần này'}
                {p === 'month' && 'Tháng này'}
              </button>
            ))}
          </div>



          {/* Leaderboard List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="text-white text-sm">Đang tải...</div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🎮</div>
              <div className="text-white/70 text-sm">Chưa có dữ liệu</div>
            </div>
          ) : (
            <div className="space-y-2">
              {currentData.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 p-2 rounded-xl ${getRankColor(entry.rank)}`}
                >
                  <div className="w-8 text-center font-bold text-lg">
                    {entry.rank <= 3 ? (
                      <span>{getRankIcon(entry.rank)}</span>
                    ) : (
                      <span className="text-white/70 text-sm">#{entry.rank}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-white font-semibold text-sm truncate mr-2">
                        {entry.phone || '******'}
                      </div>
                      <div className="text-white/80 text-xs whitespace-nowrap">
                        {entry.gamesPlayed} lượt chơi
                      </div>
                    </div>
                    {entry.email && (
                      <div className="text-white/60 text-xs truncate">
                        {entry.email}
                      </div>
                    )}
                  </div>
                  <div className="text-right min-w-[80px]">
                    <div className="text-yellow-400 font-bold text-base">
                      {entry.totalScore.toLocaleString()}
                    </div>
                    <div className="text-white/60 text-[10px]">điểm</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {leaderboard.length > 0 && (
            <div className="flex justify-center items-center gap-4 mt-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs disabled:opacity-30 hover:bg-white/20"
              >
                Trước
              </button>
              <span className="text-white/70 text-xs">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs disabled:opacity-30 hover:bg-white/20"
              >
                Sau
              </button>
            </div>
          )}

          {/* View All Button */}
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/leaderboard/all')}
              className="text-yellow-400 text-xs hover:text-yellow-300 underline"
            >
              Xem tất cả bảng xếp hạng
            </button>
          </div>

          {/* Info */}
          <div className="mt-4 text-center text-white/50 text-[10px]">
            <p>Xếp hạng theo tổng điểm tích lũy</p>
            <p>Cập nhật realtime</p>
          </div>
        </div>

        {/* Prizes Section */}
        <div className="glass rounded-3xl p-4 max-w-md w-full mt-4">
          <h2 className="text-lg font-bold text-white mb-3 text-center">
            🎁 Giải Thưởng Top 10
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-white bg-yellow-500/20 p-2 rounded-lg">
              <span>🥇 Hạng 1</span>
              <span className="font-bold text-yellow-400">500.000đ</span>
            </div>
            <div className="flex justify-between text-white bg-gray-500/20 p-2 rounded-lg">
              <span>🥈 Hạng 2</span>
              <span className="font-bold text-gray-300">300.000đ</span>
            </div>
            <div className="flex justify-between text-white bg-orange-500/20 p-2 rounded-lg">
              <span>🥉 Hạng 3</span>
              <span className="font-bold text-orange-400">200.000đ</span>
            </div>
            <div className="flex justify-between text-white/70 bg-white/5 p-2 rounded-lg">
              <span>Hạng 4-10</span>
              <span className="font-bold">100.000đ</span>
            </div>
          </div>
          <p className="text-center text-white/50 text-[10px] mt-3">
            * Giải thưởng được trao vào cuối mỗi chiến dịch
          </p>
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
          setIsLoggedIn(false)
          setUser(null)
        }}
      />

      {/* Bottom Navigation - luôn hiển thị */}
      <BottomNavigation
        onProfileClick={() => setShowProfile(true)}
        onLoginClick={() => router.push('/')}
        isLoggedIn={isLoggedIn}
        showProfile={true}
      />
    </main>
  )
}
