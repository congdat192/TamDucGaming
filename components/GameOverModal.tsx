'use client'

import { useState } from 'react'

interface Voucher {
  code: string
  value: number
  label: string
}

interface GameOverModalProps {
  isOpen: boolean
  score: number
  voucher: Voucher | null
  onPlayAgain: () => void
  onGoHome: () => void
  playsRemaining: number
}

export default function GameOverModal({
  isOpen,
  score,
  voucher,
  onPlayAgain,
  onGoHome,
  playsRemaining
}: GameOverModalProps) {
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [sending, setSending] = useState(false)

  if (!isOpen) return null

  const handleCopyVoucher = () => {
    if (voucher) {
      navigator.clipboard.writeText(voucher.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSendEmail = async () => {
    if (!email || !voucher) return
    setSending(true)

    try {
      await fetch('/api/voucher/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, voucherCode: voucher.code })
      })
      setEmailSent(true)
    } catch (error) {
      console.error('Failed to send email:', error)
    } finally {
      setSending(false)
    }
  }

  const handleShare = () => {
    const text = `🎅 Tôi vừa đạt ${score} điểm trong Santa Jump - Mắt Kính Tâm Đức! Chơi ngay: ${window.location.origin}`

    if (navigator.share) {
      navigator.share({ text, url: window.location.origin })
    } else {
      navigator.clipboard.writeText(text)
      alert('Đã copy link chia sẻ!')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-blue-900 to-blue-950 rounded-3xl p-6 max-w-md w-full border-4 border-yellow-400 shadow-2xl score-popup">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-2">
            {score >= 30 ? '🏆' : score >= 20 ? '🥈' : score >= 10 ? '🥉' : '🎮'}
          </div>
          <h2 className="text-3xl font-bold text-white mb-1">KẾT QUẢ</h2>
          <div className="text-5xl font-bold text-yellow-400 my-4">
            {score} <span className="text-2xl">điểm</span>
          </div>
        </div>

        {/* Voucher Section */}
        {voucher ? (
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-4 mb-4">
            <div className="text-center">
              <p className="text-green-200 text-sm mb-1">🎁 Chúc mừng! Bạn nhận được</p>
              <p className="text-3xl font-bold text-white mb-2">
                VOUCHER {voucher.label}
              </p>
              <div className="bg-white/20 rounded-xl p-3 flex items-center justify-between gap-2">
                <code className="text-white font-mono text-lg flex-1 text-center">
                  {voucher.code}
                </code>
                <button
                  onClick={handleCopyVoucher}
                  className="px-3 py-1 bg-white text-green-700 rounded-lg text-sm font-bold hover:bg-green-100 transition-colors"
                >
                  {copied ? '✓ Đã copy' : 'Copy'}
                </button>
              </div>

              {/* Email option */}
              {!emailSent ? (
                <div className="mt-3 flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email nhận voucher"
                    className="flex-1 px-3 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <button
                    onClick={handleSendEmail}
                    disabled={!email || sending}
                    className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg text-sm disabled:opacity-50"
                  >
                    {sending ? '...' : 'Gửi'}
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-green-200 text-sm">✅ Đã gửi voucher đến email!</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white/10 rounded-2xl p-4 mb-4 text-center">
            <p className="text-white/70">Đạt 10 điểm trở lên để nhận voucher!</p>
            <div className="mt-2 text-sm text-white/50">
              <p>≥ 10 điểm → 50K | ≥ 20 điểm → 100K | ≥ 30 điểm → 150K</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {playsRemaining > 0 ? (
            <button
              onClick={onPlayAgain}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-xl rounded-xl hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 shadow-lg"
            >
              🎮 CHƠI LẠI ({playsRemaining} lượt)
            </button>
          ) : (
            <div className="text-center py-4 bg-white/10 rounded-xl">
              <p className="text-white/70 mb-2">Bạn đã hết lượt chơi hôm nay!</p>
              <p className="text-yellow-400 text-sm">Giới thiệu bạn bè để có thêm lượt</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
            >
              📤 Chia sẻ
            </button>
            <button
              onClick={onGoHome}
              className="flex-1 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-all"
            >
              🏠 Trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
