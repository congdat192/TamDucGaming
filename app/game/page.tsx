'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import useSWR, { mutate } from 'swr'
import GameCanvas, { getHoneypotValue } from '@/components/GameCanvas'
import GameOverModal from '@/components/GameOverModal'
import ProfileModal from '@/components/ProfileModal'
import AddPhoneModal from '@/components/AddPhoneModal'
import OutOfPlaysModal from '@/components/OutOfPlaysModal'
import BottomNavigation from '@/components/BottomNavigation'
import { getGameConfig } from '@/lib/gameConfig'
import { hmacSHA256Client } from '@/lib/crypto'
// import Snowflakes from '@/components/Snowflakes'
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
  const [isStarting, setIsStarting] = useState(false) // Prevent duplicate start calls
  // Removed currentScore state to prevent re-renders
  const [showGameOver, setShowGameOver] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showAddPhone, setShowAddPhone] = useState(false)
  const [showOutOfPlaysModal, setShowOutOfPlaysModal] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [playsRemaining, setPlaysRemaining] = useState(0)
  const [gameToken, setGameToken] = useState<string | null>(null)
  const [challenge, setChallenge] = useState<string | null>(null) // For HMAC payload signing
  const [startTime, setStartTime] = useState<number>(0) // Track game start time for duration
  const [error, setError] = useState<string | null>(null) // Error message for non-blocking display

  const fetcher = (url: string) => fetch(url).then((res) => res.json())

  const { data: authData, error: authError, isLoading } = useSWR('/api/auth/me', fetcher, {
    revalidateOnFocus: true,
    shouldRetryOnError: false
  })

  // Auto scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

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

  const calculatePlaysRemaining = async (userData: User) => {
    // Test accounts have unlimited plays
    const isTestPhone = userData.phone && TEST_PHONES.includes(userData.phone)
    const isTestEmail = userData.email && TEST_EMAILS.includes(userData.email)

    if (isTestPhone || isTestEmail) {
      setPlaysRemaining(999)
      return
    }

    // Fetch config from database to get maxPlaysPerDay
    const config = await getGameConfig()
    const maxPlaysPerDay = config.maxPlaysPerDay
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
    // Prevent starting if Game Over modal is open or already starting
    if (showGameOver || isStarting) return

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

    // Set starting state to prevent duplicate calls
    setIsStarting(true)

    try {
      // Consume a play
      const res = await fetch('/api/game/start', {
        method: 'POST'
      })

      const data = await res.json()

      if (!res.ok) {
        // Reset isPlaying on error so user can try again
        setIsPlaying(false)
        // Show error message without blocking UI
        setError(data.error || 'Không thể bắt đầu game')
        setTimeout(() => setError(null), 5000) // Auto-dismiss after 5s
        return
      }

      // Update plays remaining from server response
      if (data.playsRemaining !== undefined) {
        setPlaysRemaining(data.playsRemaining)
      }

      if (data.gameToken) {
        setGameToken(data.gameToken)
      }

      // 🔐 PAYLOAD SIGNING: Store challenge for HMAC verification
      if (data.challenge) {
        setChallenge(data.challenge)
      }

      // Track start time for duration calculation
      setStartTime(Date.now())

      setIsPlaying(true)
      setShowGameOver(false)
    } catch (error) {
      // Reset isPlaying on error so user can try again
      setIsPlaying(false)
      console.error('Failed to start game:', error)
    } finally {
      // Reset starting state after 1 second debounce
      setTimeout(() => setIsStarting(false), 1000)
    }
  }

  const handleScoreUpdate = useCallback((score: number) => {
    // Do nothing to prevent re-render of parent
    // Score is handled inside GameCanvas for display
  }, [])

  // Use ref for user to avoid re-creating handleGameOver when user updates
  const userRef = useRef(user)
  useEffect(() => {
    userRef.current = user
  }, [user])

  const [totalScore, setTotalScore] = useState(0)

  const handleGameOver = useCallback(async (score: number) => {
    setIsPlaying(false)

    try {
      // 🍯 HONEYPOT: Check if honeypot was modified
      const honeypotValue = getHoneypotValue()

      // 🔐 PAYLOAD SIGNING: Calculate duration and sign payload
      const duration = Math.floor((Date.now() - startTime) / 1000) // Duration in seconds
      let signature = ''

      if (challenge && gameToken) {
        // Create payload string: gameToken|score|duration
        const payload = `${gameToken}|${score}|${duration}`

        // Sign payload with challenge as key
        signature = await hmacSHA256Client(payload, challenge)
      }

      // Submit score and get available vouchers
      const res = await fetch('/api/game/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          gameToken,
          duration, // Send duration for validation
          signature, // Send HMAC signature
          _h: honeypotValue // Send honeypot value for server validation
        })
      })

      const data = await res.json()

      // Use validated score from server (not client score)
      // Server validates and may adjust the score
      if (data.score !== undefined) {
        setFinalScore(data.score) // validated_score from server
      } else {
        setFinalScore(score) // fallback to client score if error
      }

      if (data.totalScore !== undefined) {
        setTotalScore(data.totalScore)
      }

      // ✅ Update playsRemaining immediately from server response
      if (data.playsRemaining !== undefined) {
        setPlaysRemaining(data.playsRemaining)
      }

      // Clear gameToken ONLY after successful game end
      // This ensures cleanup can distinguish between completed and abandoned sessions
      setGameToken(null)

      // Refresh user data in background
      refreshAuth()
    } catch (error) {
      console.error('Failed to submit score:', error)
      setFinalScore(score) // fallback on error
      // Note: gameToken NOT cleared on error, so cleanup will abandon the session
    }

    // NEW LOGIC: Always show GameOverModal after game ends
    setShowGameOver(true)
  }, [gameToken, challenge, startTime])

  const handlePlayAgain = () => {
    setShowGameOver(false)

    // Check if user has plays remaining
    if (playsRemaining <= 0) {
      // Out of plays - show appropriate modal
      if (user && !user.phone) {
        setShowAddPhone(true)
      } else {
        setShowOutOfPlaysModal(true)
      }
      return
    }

    // Set isPlaying immediately to prevent duplicate taps during API call
    setIsPlaying(true)

    handleStartGame()
  }

  const handleGoHome = () => {
    // Reset all states before navigation
    setShowGameOver(false)
    setIsPlaying(false)
    setIsStarting(false)
    setGameToken(null)
    router.push('/')
  }

  // Use ref to track current gameToken for cleanup
  const gameTokenRef = useRef<string | null>(null)
  const isPlayingRef = useRef(false)

  useEffect(() => {
    gameTokenRef.current = gameToken
    isPlayingRef.current = isPlaying
  }, [gameToken, isPlaying])

  // Cleanup: Abandon session if user leaves page while game is in progress
  useEffect(() => {
    return () => {
      // Only abandon if there's an active game token (game started but not ended)
      // Use ref values to get the latest state at unmount time
      const currentToken = gameTokenRef.current
      const currentlyPlaying = isPlayingRef.current

      if (currentToken && currentlyPlaying) {
        fetch('/api/game/abandon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameToken: currentToken }),
          keepalive: true // Ensure request completes even if page is unloading
        }).catch(err => console.error('Failed to abandon session:', err))
      }
    }
  }, []) // Empty dependency array - only run on mount/unmount

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
      {/* Error Toast - Non-blocking */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Snowflakes background */}
      {/* <Snowflakes /> */}
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
        totalScore={totalScore}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
        playsRemaining={playsRemaining}
        referralCode={user?.referral_code}
        hasPhone={!!user?.phone}
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
        onClose={() => setShowAddPhone(false)}
        onSuccess={() => {
          setShowAddPhone(false)
          refreshAuth() // Refresh user data để cập nhật lượt chơi mới
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
    </div>
  )
}
