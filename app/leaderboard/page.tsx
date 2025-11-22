'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Snowflakes from '@/components/Snowflakes'
import BottomNavigation from '@/components/BottomNavigation'
import ProfileModal from '@/components/ProfileModal'

interface LeaderboardEntry {
  rank: number
  phone: string
  totalScore: number
  gamesPlayed: number
}

interface Campaign {
  id: string
  name: string
  start_date: string
  end_date: string
}

type Period = 'week' | 'month' | 'campaign' | 'all'

export default function LeaderboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [period, setPeriod] = useState<Period>('all')
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [showProfile, setShowProfile] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    fetchLeaderboard()
    checkAuth()
  }, [period, selectedCampaign])

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

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      let url = `/api/leaderboard?period=${period}`
      if (period === 'campaign' && selectedCampaign) {
        url += `&campaignId=${selectedCampaign}`
      }

      const res = await fetch(url)
      const data = await res.json()

      setLeaderboard(data.leaderboard || [])
      setCampaigns(data.campaigns || [])
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
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

  return (
    <main className="min-h-screen relative overflow-hidden pb-20">
      <Snowflakes />

      {/* Header */}
      <header className="relative z-10 py-4 px-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-white/70 hover:text-white transition-colors"
          >
            ← Quay lại
          </button>
          <h1 className="text-xl font-bold text-white">🏆 Bảng Xếp Hạng</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 py-4">
        <div className="glass rounded-3xl p-6 max-w-md w-full">
          {/* Period Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
            {(['all', 'week', 'month', 'campaign'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  period === p
                    ? 'bg-yellow-500 text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {p === 'all' && 'Tất cả'}
                {p === 'week' && 'Tuần này'}
                {p === 'month' && 'Tháng này'}
                {p === 'campaign' && 'Chiến dịch'}
              </button>
            ))}
          </div>

          {/* Campaign Selector */}
          {period === 'campaign' && campaigns.length > 0 && (
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="w-full px-4 py-2 mb-4 bg-white/10 rounded-xl text-white border border-white/20 focus:outline-none focus:border-yellow-400"
            >
              <option value="">Chọn chiến dịch</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id} className="text-black">
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Leaderboard List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="text-white text-lg">Đang tải...</div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎮</div>
              <div className="text-white/70">Chưa có dữ liệu</div>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 p-3 rounded-xl ${getRankColor(entry.rank)}`}
                >
                  <div className="w-10 text-center font-bold text-xl">
                    {entry.rank <= 3 ? (
                      <span>{getRankIcon(entry.rank)}</span>
                    ) : (
                      <span className="text-white/70 text-sm">#{entry.rank}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-semibold">{entry.phone}</div>
                    <div className="text-white/60 text-xs">
                      {entry.gamesPlayed} lượt chơi
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold text-lg">
                      {entry.totalScore.toLocaleString()}
                    </div>
                    <div className="text-white/60 text-xs">điểm</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="mt-6 text-center text-white/50 text-xs">
            <p>Xếp hạng theo tổng điểm tích lũy</p>
            <p className="mt-1">Cập nhật realtime</p>
          </div>
        </div>

        {/* Prizes Section */}
        <div className="glass rounded-3xl p-6 max-w-md w-full mt-6">
          <h2 className="text-xl font-bold text-white mb-4 text-center">
            🎁 Giải Thưởng Top 10
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-white bg-yellow-500/20 p-3 rounded-xl">
              <span>🥇 Hạng 1</span>
              <span className="font-bold text-yellow-400">500.000đ</span>
            </div>
            <div className="flex justify-between text-white bg-gray-500/20 p-3 rounded-xl">
              <span>🥈 Hạng 2</span>
              <span className="font-bold text-gray-300">300.000đ</span>
            </div>
            <div className="flex justify-between text-white bg-orange-500/20 p-3 rounded-xl">
              <span>🥉 Hạng 3</span>
              <span className="font-bold text-orange-400">200.000đ</span>
            </div>
            <div className="flex justify-between text-white/70 bg-white/5 p-3 rounded-xl">
              <span>Hạng 4-10</span>
              <span className="font-bold">100.000đ</span>
            </div>
          </div>
          <p className="text-center text-white/50 text-xs mt-4">
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
