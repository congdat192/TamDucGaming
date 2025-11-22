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
        </div>

        {/* Voucher Section */}
        {voucher ? (
          <div className="glass rounded-2xl p-4 mb-3">
            <div className="text-center">
              <p className="text-white/70 text-xs mb-1">🎁 Chúc mừng! Bạn nhận được</p>
              <p className="text-2xl font-bold text-white mb-2">
                VOUCHER {voucher.label}
              </p>
              <div className="bg-white/10 rounded-lg p-2 flex items-center justify-between gap-2 border border-white/20">
                <code className="text-white font-mono text-sm flex-1 text-center font-bold">
                  {voucher.code}
                </code>
                <button
                  onClick={handleCopyVoucher}
                  className="px-3 py-1 bg-yellow-400 text-black rounded text-xs font-bold hover:bg-yellow-500 transition">
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>

              {/* Email option */}
              {!emailSent ? (
                <div className="mt-2 flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email nhận voucher"
                    className="flex-1 px-2 py-1 rounded bg-white/10 text-white placeholder-white/50 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-400 border border-white/20" />
                  <button
                    onClick={handleSendEmail}
                    disabled={!email || sending}
                    className="px-2 py-1 bg-yellow-400 text-black font-bold rounded text-xs disabled:opacity-50 hover:bg-yellow-500 transition">
                    {sending ? '...' : 'Gửi'}
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-green-400 text-xs">✅ Đã gửi email!</p>
              )}
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-4 mb-3 text-center">
            <p className="text-white/80 text-sm mb-1">Đạt 10 điểm để nhận voucher!</p>
            <p className="text-xs text-white/60">≥10đ → 50K | ≥20đ → 100K | ≥30đ → 150K</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {/* Share CTA */}
          <button
            onClick={handleShare}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm rounded-xl hover:from-green-600 hover:to-emerald-700 transition">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">🎁</span>
              <div>
                <div className="text-xs text-green-100">Chia sẻ nhận</div>
                <div className="font-bold">+1 LƯỢT MIỄN PHÍ</div>
              </div>
            </div>
          </button>

          {playsRemaining > 0 ? (
            <button
              onClick={onPlayAgain}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-base rounded-xl hover:from-red-600 hover:to-red-700 transition">
              🎮 CHƠI LẠI ({playsRemaining} lượt)
            </button>
          ) : (
            <div className="text-center py-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-white/80 text-sm mb-1">Hết lượt chơi hôm nay!</p>
              <p className="text-yellow-400 text-xs font-bold">👆 Chia sẻ để có thêm lượt</p>
            </div>
          )}

          <button
            onClick={onGoHome}
            className="w-full py-2.5 bg-white/10 text-white font-medium text-sm rounded-xl hover:bg-white/20 transition border border-white/20">
            🏠 Trang chủ
          </button>
        </div>
      </div>
    </div>
  )
}
