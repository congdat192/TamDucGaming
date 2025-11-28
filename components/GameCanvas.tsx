'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { SantaJumpGame } from '@/lib/game/engine'
import { getGameConfig } from '@/lib/gameConfig'
import { useAntiCheat } from '@/hooks/useAntiCheat'

interface GameCanvasProps {
  onGameOver: (score: number) => void
  onScoreUpdate: (score: number) => void
  isPlaying: boolean
  onStartGame: () => void
  playsRemaining: number
}

function GameCanvasComponent({ onGameOver, onScoreUpdate, isPlaying, onStartGame, playsRemaining }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<SantaJumpGame | null>(null)
  const [currentScore, setCurrentScore] = useState(0)
  const [isPracticeMode, setIsPracticeMode] = useState(false)

  // 🛡️ Anti-Cheat Protection
  const { status: antiCheatStatus, verifyTouch } = useAntiCheat({
    requireTouch: true,
    blockDevTools: true,
    checkFingerprint: true,
    onViolation: (reason) => {
      console.warn('[ANTI-CHEAT VIOLATION]', reason)
    }
  })

  // 🍯 HONEYPOT: Setup fake variables to catch script kiddies
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Create fake global variables that hackers will find and modify
    // These should NEVER be touched by legitimate code
    ;(window as any).gameScore = 0
    ;(window as any).maxScore = 0
    ;(window as any).currentPoints = 0
    ;(window as any).playerScore = 0

    // Cleanup on unmount
    return () => {
      delete (window as any).gameScore
      delete (window as any).maxScore
      delete (window as any).currentPoints
      delete (window as any).playerScore
    }
  }, [])

  const handleScoreUpdate = useCallback((score: number) => {
    // Only update local state if score changed
    setCurrentScore(prev => {
      if (prev !== score) {
        // Defer parent update to next tick to avoid render thrashing
        requestAnimationFrame(() => onScoreUpdate(score))
        return score
      }
      return prev
    })
  }, [onScoreUpdate])

  const handleGameOver = useCallback((finalScore: number) => {
    onGameOver(finalScore)
  }, [onGameOver])

  useEffect(() => {
    if (!canvasRef.current) return

    // Fetch game config and initialize game with mechanics
    const initGame = async () => {
      const config = await getGameConfig()

      gameRef.current = new SantaJumpGame(
        canvasRef.current!,
        handleScoreUpdate,
        handleGameOver,
        config.gameMechanics,
        undefined, // No SFX
        // Event-driven phase updates instead of polling
        (phase) => {
          setIsPracticeMode(phase === 'practice')
        }
      )
    }

    initGame()

    return () => {
      gameRef.current?.destroy()
    }
  }, [handleScoreUpdate, handleGameOver])

  useEffect(() => {
    if (!gameRef.current) return

    if (!isPlaying) {
      gameRef.current.reset()
      setCurrentScore(0)
      setIsPracticeMode(false)
    }
  }, [isPlaying])

  const handleInteraction = useCallback(() => {
    // Verify touch on first interaction
    if (!antiCheatStatus.touchVerified) {
      verifyTouch()
    }

    if (!isPlaying) {
      onStartGame()
      return
    }
    gameRef.current?.jump()
  }, [isPlaying, onStartGame, antiCheatStatus.touchVerified, verifyTouch])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        handleInteraction()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleInteraction])

  return (
    <div
      className="relative flex flex-col items-center select-none"
      onClick={handleInteraction}
      onTouchStart={(e) => {
        e.preventDefault()
        handleInteraction()
      }}
      onTouchEnd={(e) => {
        e.preventDefault()
      }}
      style={{
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        // GPU acceleration
        transform: 'translateZ(0)',
        willChange: 'transform'
      }}
    >
      <canvas
        ref={canvasRef}
        className="border-4 border-yellow-400 rounded-2xl shadow-2xl cursor-pointer"
        style={{
          maxWidth: '100%',
          height: 'auto',
          touchAction: 'manipulation',
          // GPU acceleration for canvas
          transform: 'translateZ(0)',
          willChange: 'transform'
        }}
      />

      {/* Score Display - Simplified for performance */}
      {isPlaying && !isPracticeMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className="bg-black/60 px-6 py-2 rounded-full border border-white/30">
            <span className="text-white font-bold text-3xl font-mono">
              {currentScore}
            </span>
          </div>
        </div>
      )}

      {/* Practice Mode Overlay - Shows instructions during practice */}
      {isPracticeMode && (
        <div className="absolute inset-0 flex flex-col items-center justify-start pt-4 rounded-2xl pointer-events-none px-4">
          {/* Main instruction */}
          <div className="bg-gradient-to-r from-green-400 to-emerald-500 px-6 py-3 rounded-2xl shadow-2xl border-4 border-white animate-pulse mb-3">
            <p className="text-white text-2xl font-black drop-shadow-lg text-center">
              👆 NHẤN ĐỂ NHẢY 👆
            </p>
          </div>

          {/* Practice tips */}
          <div className="bg-black/70 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20 max-w-sm">
            <p className="text-yellow-400 text-sm font-bold mb-2 text-center">
              🎯 MÀN HÌNH LUYỆN TẬP
            </p>
            <ul className="text-white/90 text-xs space-y-1">
              <li>• Nhấn màn hình hoặc Space để nhảy</li>
              <li>• Tránh chướng ngại vật màu đỏ</li>
              <li>• Thử vài lần để làm quen nhịp độ</li>
              <li>• Màn hình này không tính điểm</li>
            </ul>
          </div>
        </div>
      )}

      {/* Start Overlay - pointer-events-none vì parent div xử lý touch */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl pointer-events-none">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🎅</div>
            <p className="text-white text-xl font-bold mb-2">TAP ĐỂ BẮT ĐẦU</p>
            <p className="text-white/70 text-sm mb-4">Nhấn Space hoặc tap màn hình</p>

            {/* Plays Counter - Below instructions */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 px-5 py-2.5 rounded-full shadow-xl border-2 border-yellow-300">
              <span className="text-xl">🎮</span>
              <span className="text-black font-bold text-base whitespace-nowrap">
                Số lượt còn lại: {playsRemaining === 999 ? '∞' : playsRemaining}
              </span>
            </div>

            {/* Game Instructions - Show on start screen */}
            <div className="mt-6">
              <div className="bg-black/70 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20 max-w-sm mx-auto">
                <p className="text-yellow-400 text-sm font-bold mb-2 text-center">
                  🎯 CÁCH CHƠI
                </p>
                <ul className="text-white/90 text-xs space-y-1">
                  <li>• Nhấn màn hình hoặc Space để nhảy</li>
                  <li>• Tránh chướng ngại vật ống khói</li>
                  <li>• Mỗi ống khói vượt qua = +1 điểm</li>
                  <li>• Chạm ống khói hoặc mặt đất = Game Over</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🛡️ Anti-Cheat Warnings */}
      {/* DevTools Detection Warning */}
      {antiCheatStatus.devToolsOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/95 backdrop-blur-sm rounded-2xl z-50">
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-white text-2xl font-bold mb-4">
              DevTools Phát Hiện
            </h2>
            <p className="text-white/90 mb-6">
              Vui lòng đóng DevTools (F12) để chơi game.
              <br />
              Game chỉ hỗ trợ trên điện thoại di động.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-red-900 px-6 py-3 rounded-lg font-bold hover:bg-red-100"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      )}

      {/* Suspicious Fingerprint Warning */}
      {antiCheatStatus.fingerprintSuspicious && !antiCheatStatus.devToolsOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-orange-900/95 backdrop-blur-sm rounded-2xl z-50">
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-white text-2xl font-bold mb-4">
              Thiết Bị Không Hợp Lệ
            </h2>
            <p className="text-white/90 mb-4">
              Game chỉ hỗ trợ trên điện thoại di động thật.
              <br />
              Vui lòng không sử dụng chế độ giả lập (emulation).
            </p>
            <p className="text-white/70 text-sm mb-6">
              Suspicion Score: {antiCheatStatus.suspicionScore}/100
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-orange-900 px-6 py-3 rounded-lg font-bold hover:bg-orange-100"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Touch Verification Screen */}
      {!antiCheatStatus.touchVerified && !antiCheatStatus.devToolsOpen && !antiCheatStatus.fingerprintSuspicious && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-900/90 backdrop-blur-sm rounded-2xl z-40 pointer-events-auto">
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-4 animate-bounce">👆</div>
            <h2 className="text-white text-2xl font-bold mb-4">
              Chạm Màn Hình
            </h2>
            <p className="text-white/90 mb-6">
              Vui lòng chạm vào màn hình để xác nhận bạn đang sử dụng thiết bị di động
            </p>
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <p className="text-white/70 text-sm">
                🔒 Bảo mật: Game chỉ hoạt động trên màn hình cảm ứng
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 🍯 HONEYPOT: Export function to check if honeypot was modified
export function getHoneypotValue(): number {
  if (typeof window === 'undefined') return 0

  // Check if ANY of the honeypot variables were modified
  const gameScore = (window as any).gameScore || 0
  const maxScore = (window as any).maxScore || 0
  const currentPoints = (window as any).currentPoints || 0
  const playerScore = (window as any).playerScore || 0

  // Return the sum of all honeypot values
  // If ANY were modified, this will be > 0
  return gameScore + maxScore + currentPoints + playerScore
}

// Memoize the component to prevent re-renders when parent state changes
const GameCanvas = import('react').then(mod => mod.memo(GameCanvasComponent)) as unknown as typeof GameCanvasComponent
export default GameCanvasComponent
