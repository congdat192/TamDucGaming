'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { SantaJumpGame } from '@/lib/game/engine'
import { getGameConfig } from '@/lib/gameConfig'

interface GameCanvasProps {
  onGameOver: (score: number) => void
  onScoreUpdate: (score: number) => void
  isPlaying: boolean
  onStartGame: () => void
  playsRemaining: number
  isSubmitting?: boolean
}

function GameCanvasComponent({ onGameOver, onScoreUpdate, isPlaying, onStartGame, playsRemaining, isSubmitting = false }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<SantaJumpGame | null>(null)
  const [currentScore, setCurrentScore] = useState(0)
  const [isPracticeMode, setIsPracticeMode] = useState(false)

  // 🍯 HONEYPOT: Setup fake variables to catch script kiddies
  useEffect(() => {
    if (typeof window === 'undefined') return

      // Create fake global variables that hackers will find and modify
      // These should NEVER be touched by legitimate code
      ; (window as any).gameScore = 0
      ; (window as any).maxScore = 0
      ; (window as any).currentPoints = 0
      ; (window as any).playerScore = 0

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
    if (!isPlaying) {
      onStartGame()
      return
    }
    gameRef.current?.jump()
  }, [isPlaying, onStartGame])

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
      {!isPlaying && !isSubmitting && (
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

            {/* Start Button - Added for clarity */}
            <div className="mt-6">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleInteraction()
                }}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-xl px-12 py-4 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-200 border-4 border-white/30 active:scale-95"
              >
                🎮 Bắt đầu chơi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submitting Overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl pointer-events-none z-50">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-2">⏳</div>
            <p className="text-white font-bold">Đang tính điểm...</p>
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
