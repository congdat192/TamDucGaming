'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getGameConfig, type GameConfig, type VoucherTier } from '@/lib/gameConfig'

interface Voucher {
  code: string
  value: number
  label: string
}

interface GameOverModalProps {
  isOpen: boolean
  score: number
  totalScore: number
  availableVouchers: VoucherTier[]
  onPlayAgain: () => void
  onGoHome: () => void
  playsRemaining: number
  referralCode?: string
}

export default function GameOverModal({
  isOpen,
  score,
  totalScore,
  availableVouchers,
  onPlayAgain,
  onGoHome,
  playsRemaining,
  referralCode
}: GameOverModalProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [config, setConfig] = useState<GameConfig | null>(null)
  const [redeemedVoucher, setRedeemedVoucher] = useState<Voucher | null>(null)
  const [redeeming, setRedeeming] = useState(false)

  useEffect(() => {
    const loadConfig = async () => {
      const gameConfig = await getGameConfig()
      setConfig(gameConfig)
    }
    loadConfig()
  }, [])

  if (!isOpen || !config) return null

  const modalContent = config.modalContent.gameOverModal

  const handleRedeemVoucher = async (voucherTier: VoucherTier) => {
    setRedeeming(true)
    try {
      const res = await fetch('/api/voucher/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minScore: voucherTier.minScore })
      })

      const data = await res.json()

      if (data.success && data.voucher) {
        setRedeemedVoucher(data.voucher)
      } else {
        alert(data.error || 'Không thể đổi voucher')
      }
    } catch (error) {
      console.error('Failed to redeem voucher:', error)
      alert('Đã xảy ra lỗi')
    } finally {
      setRedeeming(false)
    }
  }

  const handleCopyVoucher = () => {
    if (redeemedVoucher) {
      navigator.clipboard.writeText(redeemedVoucher.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSendEmail = async () => {
    if (!email || !redeemedVoucher) return
    setSending(true)

    try {
      await fetch('/api/voucher/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, voucherCode: redeemedVoucher.code })
      })
      setEmailSent(true)
    } catch (error) {
      console.error('Failed to send email:', error)
    } finally {
      setSending(false)
    }
  }

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
            // Case 1: Has plays -> Show Play Again ONLY
            <button
              onClick={onPlayAgain}
              className="w-full py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-base rounded-xl hover:from-red-600 hover:to-red-700 transition shadow-lg shadow-red-500/20 animate-pulse">
              {modalContent.playAgainButton} ({playsRemaining} lượt)
            </button>
          ) : (
            // Case 2: Out of plays -> Show 3 buttons
            <>
              {/* Disabled Play Again */}
              <button
                disabled
                className="w-full py-3.5 bg-white/5 text-white/40 font-bold text-base rounded-xl cursor-not-allowed border border-white/10">
                🎮 Đã hết lượt chơi
              </button>

              {/* Invite Friends -> Go to Referral Page */}
              <button
                onClick={() => router.push('/referral')}
                className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm rounded-xl hover:from-green-600 hover:to-emerald-700 transition shadow-lg shadow-green-500/20">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">🎁</span>
                  <div>
                    <div className="text-xs text-green-100">Mời bạn bè chơi</div>
                    <div className="font-bold">{modalContent.inviteButton.toUpperCase()}</div>
                  </div>
                </div>
              </button>
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
