'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { SantaJumpGame } from '@/lib/game/engine'

interface GameCanvasProps {
  onGameOver: (score: number) => void
  onScoreUpdate: (score: number) => void
  isPlaying: boolean
  onStartGame: () => void
  playsRemaining: number
}

export default function GameCanvas({ onGameOver, onScoreUpdate, isPlaying, onStartGame, playsRemaining }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<SantaJumpGame | null>(null)
  const [currentScore, setCurrentScore] = useState(0)
  const [isPracticeMode, setIsPracticeMode] = useState(false)

  const handleScoreUpdate = useCallback((score: number) => {
    setCurrentScore(score)
    onScoreUpdate(score)
  }, [onScoreUpdate])

  const handleGameOver = useCallback((finalScore: number) => {
    onGameOver(finalScore)
  }, [onGameOver])

  useEffect(() => {
    if (!canvasRef.current) return

    gameRef.current = new SantaJumpGame(
      canvasRef.current,
      handleScoreUpdate,
      handleGameOver
    )

    return () => {
      gameRef.current?.destroy()
    }
  }, [handleScoreUpdate, handleGameOver])

  useEffect(() => {
    if (!gameRef.current) return

    if (!isPlaying) {
      gameRef.current.reset()
      setCurrentScore(0)
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

  // Poll game phase to detect practice mode
  useEffect(() => {
    if (!isPlaying || !gameRef.current) {
      setIsPracticeMode(false)
      return
    }

    const interval = setInterval(() => {
      if (gameRef.current) {
        const phase = gameRef.current.getPhase()
        setIsPracticeMode(phase === 'practice')
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying])

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
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    >
      <canvas
        ref={canvasRef}
        className="border-4 border-yellow-400 rounded-2xl shadow-2xl cursor-pointer"
        style={{ maxWidth: '100%', height: 'auto', touchAction: 'manipulation' }}
      />

      {/* Score Display */}
      {isPlaying && !isPracticeMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-6 py-2 rounded-full pointer-events-none">
          <span className="text-white font-bold text-2xl">{currentScore}</span>
        </div>
      )}

      {/* Practice Mode Overlay - Shows instructions during practice */}
      {isPracticeMode && (
        <div className="absolute inset-0 flex items-start justify-center pt-8 rounded-2xl pointer-events-none">
          <div className="text-center">
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 px-8 py-4 rounded-2xl shadow-2xl border-4 border-white animate-pulse">
              <p className="text-white text-2xl font-black mb-2 drop-shadow-lg">
                👆 NHẤN ĐỂ NHẢY 👆
              </p>
              <p className="text-white/90 text-sm font-bold">
                Thử vài lần để làm quen!
              </p>
            </div>
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

            {/* Practice Instructions - Show on start screen */}
            <div className="mt-6 animate-pulse">
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 px-6 py-3 rounded-xl shadow-xl border-2 border-white inline-block">
                <p className="text-white text-base font-black drop-shadow-lg">
                  👆 NHẤN ĐỂ NHẢY 👆
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
