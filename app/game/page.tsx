'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import GameCanvas from '@/components/GameCanvas'
import GameOverModal from '@/components/GameOverModal'
import ProfileModal from '@/components/ProfileModal'
import Snowflakes from '@/components/Snowflakes'

// Test accounts với unlimited plays
const TEST_PHONES = ['0909999999', '0123456789']
const TEST_EMAILS = ['test@test.com', 'admin@matkinhtamduc.com', 'congdat192@gmail.com']

interface User {
  id: string
  phone: string | null
  email: string | null
  name: string | null
  plays_today: number
  bonus_plays: number
  total_score: number
  referral_code: string
}

interface Voucher {
  code: string
  value: number
  label: string
}

export default function GamePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentScore, setCurrentScore] = useState(0)
  const [showGameOver, setShowGameOver] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [voucher, setVoucher] = useState<Voucher | null>(null)
  const [playsRemaining, setPlaysRemaining] = useState(0)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/')
        return
      }
      const data = await res.json()
      setUser(data.user)
      calculatePlaysRemaining(data.user)
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const calculatePlaysRemaining = (userData: User) => {
    // Test accounts have unlimited plays
    const isTestPhone = userData.phone && TEST_PHONES.includes(userData.phone)
    const isTestEmail = userData.email && TEST_EMAILS.includes(userData.email)

    if (isTestPhone || isTestEmail) {
      setPlaysRemaining(999)
      return
    }

    const maxPlaysPerDay = 1
    const usedPlays = userData.plays_today
    const bonusPlays = userData.bonus_plays
    const remaining = Math.max(0, maxPlaysPerDay - usedPlays) + bonusPlays
    setPlaysRemaining(remaining)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleStartGame = async () => {
    if (playsRemaining <= 0) {
      alert('Bạn đã hết lượt chơi! Giới thiệu bạn bè để có thêm lượt.')
      return
    }

    try {
      // Consume a play
      const res = await fetch('/api/game/start', {
        method: 'POST'
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Không thể bắt đầu game')
        return
      }

      // Update plays remaining from server response
      if (data.playsRemaining !== undefined) {
        setPlaysRemaining(data.playsRemaining)
      }

      setIsPlaying(true)
      setCurrentScore(0)
      setShowGameOver(false)
    } catch (error) {
      console.error('Failed to start game:', error)
    }
  }

  const handleScoreUpdate = useCallback((score: number) => {
    setCurrentScore(score)
  }, [])

  const handleGameOver = useCallback(async (score: number) => {
    setIsPlaying(false)
    setFinalScore(score)

    try {
      // Submit score and get voucher
      const res = await fetch('/api/game/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score })
      })

      const data = await res.json()

      if (data.voucher) {
        setVoucher(data.voucher)
      } else {
        setVoucher(null)
      }

      // Refresh user data
      await checkAuth()
    } catch (error) {
      console.error('Failed to submit score:', error)
    }

    setShowGameOver(true)
  }, [])

  const handlePlayAgain = () => {
    setShowGameOver(false)
    setVoucher(null)
    handleStartGame()
  }

  const handleGoHome = () => {
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Đang tải...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
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
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">🎅 SANTA JUMP</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 transition-colors text-sm"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* User Info Bar */}
      <div className="relative z-10 max-w-md mx-auto px-4 mb-2">
        <div className="flex justify-between items-center bg-white/10 rounded-lg px-4 py-2">
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm truncate max-w-[200px] transition-colors"
          >
            <span className="text-lg">👤</span>
            <span>{user?.name || user?.email?.split('@')[0] || user?.phone || 'Guest'}</span>
          </button>
          <span className="text-yellow-400 font-bold">
            {playsRemaining === 999 ? '∞' : playsRemaining} lượt
          </span>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-4">
        <div className="mb-4 text-center">
          {user && (
            <p className="text-white/70 text-sm">
              Tổng điểm: <span className="text-yellow-400 font-bold">{user.total_score}</span>
            </p>
          )}
        </div>

        <GameCanvas
          onGameOver={handleGameOver}
          onScoreUpdate={handleScoreUpdate}
          isPlaying={isPlaying}
          onStartGame={handleStartGame}
        />

        {/* Instructions */}
        {!isPlaying && !showGameOver && (
          <div className="mt-6 text-center">
            <p className="text-white/70 text-sm mb-4">
              Tap hoặc nhấn Space để bắt đầu và điều khiển Santa nhảy
            </p>

            {playsRemaining <= 0 && (
              <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 max-w-sm">
                <p className="text-red-300 mb-2">Bạn đã hết lượt chơi hôm nay!</p>
                <button
                  onClick={() => router.push('/referral')}
                  className="text-yellow-400 underline text-sm"
                >
                  Giới thiệu bạn bè để có thêm lượt →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={showGameOver}
        score={finalScore}
        voucher={voucher}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
        playsRemaining={playsRemaining}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
        onUserUpdate={() => {
          checkAuth()
        }}
      />
    </main>
  )
}
