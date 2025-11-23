'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  referralCode?: string
}

export default function GameOverModal({
  isOpen,
  score,
  voucher,
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
        </div>

        {/* Voucher Section */}
        {voucher ? (
          <div className="glass rounded-2xl p-4 mb-3 animate-in fade-in zoom-in duration-300">
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
          <div className="glass rounded-2xl p-4 mb-4">
            <p className="text-white/90 text-sm font-bold mb-3 text-center">Tiến độ nhận thưởng</p>

            <div className="space-y-3">
              {/* 50K Tier */}
              <div className={`flex items-center gap-3 ${score >= 10 ? 'opacity-100' : 'opacity-50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${score >= 10 ? 'bg-green-500 border-green-400' : 'bg-white/10 border-white/20'}`}>
                  {score >= 10 ? '✓' : '🔒'}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white font-bold">Voucher 50K</span>
                    <span className={score >= 10 ? 'text-green-400' : 'text-white/50'}>{Math.min(score, 10)}/10 điểm</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${Math.min((score / 10) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* 100K Tier */}
              <div className={`flex items-center gap-3 ${score >= 20 ? 'opacity-100' : 'opacity-50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${score >= 20 ? 'bg-yellow-500 border-yellow-400' : 'bg-white/10 border-white/20'}`}>
                  {score >= 20 ? '✓' : '🔒'}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white font-bold">Voucher 100K</span>
                    <span className={score >= 20 ? 'text-yellow-400' : 'text-white/50'}>{Math.min(score, 20)}/20 điểm</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 transition-all duration-500"
                      style={{ width: `${Math.min((score / 20) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* 150K Tier */}
              <div className={`flex items-center gap-3 ${score >= 30 ? 'opacity-100' : 'opacity-50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${score >= 30 ? 'bg-red-500 border-red-400' : 'bg-white/10 border-white/20'}`}>
                  {score >= 30 ? '✓' : '🔒'}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white font-bold">Voucher 150K</span>
                    <span className={score >= 30 ? 'text-red-400' : 'text-white/50'}>{Math.min(score, 30)}/30 điểm</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-500"
                      style={{ width: `${Math.min((score / 30) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {playsRemaining > 0 ? (
            // Case 1: Has plays -> Show Play Again ONLY
            <button
              onClick={onPlayAgain}
              className="w-full py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-base rounded-xl hover:from-red-600 hover:to-red-700 transition shadow-lg shadow-red-500/20 animate-pulse">
              🎮 CHƠI LẠI ({playsRemaining} lượt)
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
                    <div className="font-bold">NHẬN THÊM 5 LƯỢT</div>
                  </div>
                </div>
              </button>
            </>
          )}

          <button
            onClick={onGoHome}
            className="w-full py-3 bg-white/10 text-white font-medium text-sm rounded-xl hover:bg-white/20 transition border border-white/20">
            🏠 Về trang chủ
          </button>
        </div>
      </div>
    </div>
  )
}
