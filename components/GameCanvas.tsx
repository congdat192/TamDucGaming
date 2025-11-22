'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { SantaJumpGame } from '@/lib/game/engine'

interface GameCanvasProps {
  onGameOver: (score: number) => void
  onScoreUpdate: (score: number) => void
  isPlaying: boolean
  onStartGame: () => void
}

export default function GameCanvas({ onGameOver, onScoreUpdate, isPlaying, onStartGame }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<SantaJumpGame | null>(null)
  const [currentScore, setCurrentScore] = useState(0)

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

  return (
    <div className="relative flex flex-col items-center">
      <canvas
        ref={canvasRef}
        onClick={handleInteraction}
        onTouchStart={(e) => {
          e.preventDefault()
          handleInteraction()
        }}
        className="border-4 border-yellow-400 rounded-2xl shadow-2xl cursor-pointer touch-none"
        style={{ maxWidth: '100%', height: 'auto' }}
      />

      {/* Score Display */}
      {isPlaying && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-6 py-2 rounded-full">
          <span className="text-white font-bold text-2xl">{currentScore}</span>
        </div>
      )}

      {/* Start Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🎅</div>
            <p className="text-white text-xl font-bold mb-2">TAP ĐỂ BẮT ĐẦU</p>
            <p className="text-white/70 text-sm">Nhấn Space hoặc tap màn hình</p>
          </div>
        </div>
      )}
    </div>
  )
}
