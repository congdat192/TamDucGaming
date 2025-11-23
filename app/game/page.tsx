'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import useSWR, { mutate } from 'swr'
import GameCanvas from '@/components/GameCanvas'
import GameOverModal from '@/components/GameOverModal'
import ProfileModal from '@/components/ProfileModal'
import AddPhoneModal from '@/components/AddPhoneModal'
import OutOfPlaysModal from '@/components/OutOfPlaysModal'
import BottomNavigation from '@/components/BottomNavigation'
import Snowflakes from '@/components/Snowflakes'
// import { useBGM } from '@/hooks/useBGM'

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

  // Background music - Disabled for gameplay as requested
  // const bgm = useBGM('gameplay')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  // Removed currentScore state to prevent re-renders
  const [showGameOver, setShowGameOver] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showAddPhone, setShowAddPhone] = useState(false)
  const [showOutOfPlaysModal, setShowOutOfPlaysModal] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [pendingGameOver, setPendingGameOver] = useState(false)
  const [voucher, setVoucher] = useState<Voucher | null>(null)
  const [playsRemaining, setPlaysRemaining] = useState(0)
  const [gameToken, setGameToken] = useState<string | null>(null)

  const fetcher = (url: string) => fetch(url).then((res) => res.json())

  const { data: authData, error: authError, isLoading } = useSWR('/api/auth/me', fetcher, {
    revalidateOnFocus: true,
    shouldRetryOnError: false
  })

  useEffect(() => {
    if (authError) {
      router.push('/')
    }
    if (authData?.user) {
      setUser(authData.user)
      calculatePlaysRemaining(authData.user)
    }
  }, [authData, authError, router])

  // Remove manual checkAuth, use mutate instead
  const refreshAuth = () => {
    mutate('/api/auth/me')
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
    // Prevent starting if Game Over modal is open
    if (showGameOver) return

    if (playsRemaining <= 0) {
      // Nếu chưa có SĐT → hiện modal thêm SĐT để nhận 3 lượt
      // Nếu đã có SĐT → phải mời bạn bè
      if (user && !user.phone) {
        setShowAddPhone(true)
        setShowOutOfPlaysModal(false)
      } else {
        setShowOutOfPlaysModal(true)
        setShowAddPhone(false)
      }
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

      if (data.gameToken) {
        setGameToken(data.gameToken)
      }

      setIsPlaying(true)
      setShowGameOver(false)
    } catch (error) {
      console.error('Failed to start game:', error)
    }
  }

  const handleScoreUpdate = useCallback((score: number) => {
    // Do nothing to prevent re-render of parent
    // Score is handled inside GameCanvas for display
  }, [])

  const handleGameOver = useCallback(async (score: number) => {
    setIsPlaying(false)
    setFinalScore(score)

    try {
      // Submit score and get voucher
      const res = await fetch('/api/game/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, gameToken })
      })

      const data = await res.json()

      if (data.voucher) {
        setVoucher(data.voucher)
      } else {
        setVoucher(null)
      }

      // Refresh user data
      refreshAuth()
    } catch (error) {
      console.error('Failed to submit score:', error)
    }

    // Logic: If user has no phone, show AddPhoneModal first
    if (user && !user.phone) {
      setShowAddPhone(true)
      setPendingGameOver(true)
    } else {
      setShowGameOver(true)
    }
  }, [gameToken, user]) // Added user dependency

  const handlePlayAgain = () => {
    setShowGameOver(false)
    setVoucher(null)
    handleStartGame()
  }

  const handleGoHome = () => {
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Đang tải...</div>
      </div>
    )
  }

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
          <h1 className="text-xl font-bold text-white">🎅 SANTA JUMP</h1>
          <div className="w-10"></div>
        </div>
      </header>



      {/* Game Area */}
      <div className="relative z-10 flex flex-col items-center justify-start px-4 pt-2">
        <GameCanvas
          onGameOver={handleGameOver}
          onScoreUpdate={handleScoreUpdate}
          isPlaying={isPlaying}
          onStartGame={handleStartGame}
          playsRemaining={playsRemaining}
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
                {user && !user.phone ? (
                  <button
                    onClick={() => setShowAddPhone(true)}
                    className="text-yellow-400 underline text-sm font-semibold"
                  >
                    🎁 Cập nhật SĐT để nhận 3 lượt chơi →
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/referral')}
                    className="text-yellow-400 underline text-sm"
                  >
                    Giới thiệu bạn bè để có thêm lượt →
                  </button>
                )}
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
        referralCode={user?.referral_code}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
        onUserUpdate={() => {
          refreshAuth()
        }}
        onLogout={handleLogout}
      />

      {/* Add Phone Modal - hiển thị khi hết lượt và chưa có SĐT */}
      <AddPhoneModal
        isOpen={showAddPhone}
        onClose={() => {
          setShowAddPhone(false)
          if (pendingGameOver) {
            setShowGameOver(true)
            setPendingGameOver(false)
          }
        }}
        onSuccess={() => {
          refreshAuth() // Refresh user data để cập nhật lượt chơi mới
          if (pendingGameOver) {
            setShowGameOver(true)
            setPendingGameOver(false)
          }
        }}
      />

      {/* Out of Plays Modal */}
      <OutOfPlaysModal
        isOpen={showOutOfPlaysModal}
        onClose={() => setShowOutOfPlaysModal(false)}
        referralCode={user?.referral_code}
      />

      {/* Bottom Navigation - ẩn khi đang chơi game */}
      {!isPlaying && (
        <BottomNavigation
          onProfileClick={() => setShowProfile(true)}
          showProfile={true}
        />
      )}
    </main>
  )
}
