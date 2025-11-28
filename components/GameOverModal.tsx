'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ModalContentData {
  title: string
  playAgainButton: string
  shareButton: string
  homeButton: string
  inviteButton: string
  addPhoneButton: string
  voucherSectionTitle: string
  progressLabels: {
    label50k: string
    label100k: string
    label150k: string
  }
}

interface GameConfig {
  bonusPlaysForPhone: number
  bonusPlaysForReferral: number
}

interface GameOverModalProps {
  isOpen: boolean
  score: number
  totalScore: number
  onPlayAgain: () => void
  onGoHome: () => void
  playsRemaining: number
  referralCode?: string
  hasPhone?: boolean
}

export default function GameOverModal({
  isOpen,
  score,
  totalScore,
  onPlayAgain,
  onGoHome,
  playsRemaining,
  referralCode,
  hasPhone = false
}: GameOverModalProps) {
  const router = useRouter()
  const [modalContent, setModalContent] = useState<ModalContentData | null>(null)
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null)

  useEffect(() => {
    const loadContent = async () => {
      try {
        // Load modal content
        const contentRes = await fetch('/api/modal-content')
        const contentData = await contentRes.json()
        if (contentData.content?.gameOverModal) {
          setModalContent(contentData.content.gameOverModal)
        }

        // Load game config for dynamic bonus values
        const configRes = await fetch('/api/config/public')
        const configData = await configRes.json()
        if (configData.config) {
          setGameConfig({
            bonusPlaysForPhone: configData.config.bonusPlaysForPhone,
            bonusPlaysForReferral: configData.config.bonusPlaysForReferral
          })
        }
      } catch (err) {
        console.error('Failed to load modal content:', err)
        // Use defaults if API fails
        setModalContent({
          title: 'GAME OVER',
          playAgainButton: 'CHƠI LẠI',
          shareButton: 'CHIA SẺ NHẬN +5 LƯỢT',
          homeButton: 'Về trang chủ',
          inviteButton: 'Mời bạn bè (+5 lượt)',
          addPhoneButton: 'Cập nhật SĐT (+4 lượt)',
          voucherSectionTitle: 'Chúc mừng! Bạn đã nhận được voucher',
          progressLabels: {
            label50k: '50K',
            label100k: '100K',
            label150k: '150K',
          },
        })
        setGameConfig({
          bonusPlaysForPhone: 4,
          bonusPlaysForReferral: 5
        })
      }
    }
    loadContent()
  }, [])

  if (!isOpen || !modalContent) return null

  const handleShare = () => {
    let shareUrl = window.location.origin
    if (referralCode) {
      shareUrl += `?ref=${referralCode}`
    }

    const text = `🎅 Tôi vừa đạt ${score} điểm trong Santa Jump - Mắt Kính Tâm Đức! Chơi ngay: ${shareUrl}`

    if (navigator.share) {
      navigator.share({ text, url: shareUrl })
    } else {
      navigator.clipboard.writeText(text)
      alert('Đã copy link chia sẻ!')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="glass rounded-2xl p-5 max-w-md w-full border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">
            {score >= 30 ? '🏆' : score >= 20 ? '🥈' : score >= 10 ? '🥉' : '🎮'}
          </div>
          <h2 className="text-xl font-bold text-yellow-400 mb-1">KẾT QUẢ</h2>
          <div className="text-3xl font-bold text-white my-2">
            {score} <span className="text-lg text-yellow-400">điểm</span>
          </div>
          <p className="text-sm text-white/70">Tổng điểm: {totalScore}</p>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {playsRemaining > 0 ? (
            // Case 1: Has plays -> Show Play Again button
            <button
              onClick={onPlayAgain}
              className="w-full py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-base rounded-xl hover:from-red-600 hover:to-red-700 transition shadow-lg shadow-red-500/20 animate-pulse">
              {modalContent.playAgainButton} ({playsRemaining} lượt)
            </button>
          ) : (
            // Case 2: Out of plays -> Show different button based on phone status
            <>
              {!hasPhone ? (
                // User CHƯA có SĐT -> Show "Add Phone" button
                <button
                  onClick={onPlayAgain}
                  className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-sm rounded-xl hover:from-yellow-300 hover:to-orange-400 transition shadow-lg shadow-yellow-400/20">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">📱</span>
                    <div>
                      <div className="text-xs text-black/70">Nhận thêm lượt chơi</div>
                      <div className="font-bold">CẬP NHẬT SĐT (+{gameConfig?.bonusPlaysForPhone || 4} LƯỢT)</div>
                    </div>
                  </div>
                </button>
              ) : (
                // User ĐÃ có SĐT -> Show "Invite Friends" button
                <button
                  onClick={onPlayAgain}
                  className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm rounded-xl hover:from-green-600 hover:to-emerald-700 transition shadow-lg shadow-green-500/20">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">🎁</span>
                    <div>
                      <div className="text-xs text-green-100">Mời bạn bè chơi</div>
                      <div className="font-bold">MỜI BẠN BÈ (+{gameConfig?.bonusPlaysForReferral || 5} LƯỢT)</div>
                    </div>
                  </div>
                </button>
              )}
            </>
          )}

          <button
            onClick={onGoHome}
            className="w-full py-3 bg-white/10 text-white font-medium text-sm rounded-xl hover:bg-white/20 transition border border-white/20">
            {modalContent.homeButton}
          </button>
        </div>
      </div>
    </div>
  )
}
