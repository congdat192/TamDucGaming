'use client'

import { useState } from 'react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  referralCode?: string
}

type Step = 'input' | 'otp'

export default function LoginModal({ isOpen, onClose, onSuccess, referralCode }: LoginModalProps) {
  const [step, setStep] = useState<Step>('input')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugOtp, setDebugOtp] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, referralCode })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Không thể gửi OTP')
      }

      // Store debug OTP if available (development mode)
      if (data.debug_otp) {
        setDebugOtp(data.debug_otp)
      }

      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, referralCode })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Mã OTP không đúng')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep('input')
    setEmail('')
    setOtp('')
    setError('')
    setDebugOtp(null)
    onClose()
  }

  const isEmailValid = () => {
    return email.includes('@') && email.length > 3
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="relative bg-gradient-to-b from-green-800 to-green-900 rounded-3xl p-8 max-w-md w-full border-4 border-yellow-400 shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl w-8 h-8 flex items-center justify-center"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🎅</div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {step === 'input' ? 'ĐĂNG NHẬP' : 'XÁC THỰC OTP'}
          </h2>
          <p className="text-green-200">
            {step === 'input'
              ? 'Nhập email để bắt đầu chơi'
              : `Nhập mã OTP đã gửi đến ${email}`
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        {step === 'input' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-white mb-2 font-semibold">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-white/30 text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none text-lg"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !isEmailValid()}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-xl rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
            >
              {loading ? 'ĐANG GỬI...' : 'GỬI MÃ OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-white mb-2 font-semibold">Mã OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-white/30 text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none text-lg text-center tracking-[0.5em]"
                maxLength={6}
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-xl rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
            >
              {loading ? 'ĐANG XÁC THỰC...' : 'XÁC NHẬN'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('input')
                setOtp('')
                setError('')
              }}
              className="w-full py-2 text-white/70 hover:text-white transition-colors"
            >
              ← Đổi email
            </button>
          </form>
        )}

        <p className="text-center text-green-300 text-xs mt-6 bg-black/20 rounded-lg p-2">
          {step === 'otp' && debugOtp
            ? `💡 Demo OTP: ${debugOtp}`
            : '📧 Mã OTP sẽ được gửi đến email của bạn'
          }
        </p>
      </div>
    </div>
  )
}
