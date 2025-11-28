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

  const verifyOtp = async (otpValue: string) => {
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue, referralCode })
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

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault()
    verifyOtp(otp)
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="glass rounded-t-2xl border-b border-white/10 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <span className="text-xl">🎅</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              {step === 'input' ? 'Đăng Nhập' : 'Xác Thực OTP'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="glass rounded-b-2xl px-5 py-6">
          {/* Subtitle */}
          <p className="text-white/70 text-sm text-center mb-6">
            {step === 'input'
              ? 'Nhập email để bắt đầu chơi game'
              : `Nhập mã OTP đã gửi đến ${email}`
            }
          </p>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl mb-4 text-center text-sm">
              {error}
            </div>
          )}

          {step === 'input' ? (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label className="block text-white/90 mb-2 text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-yellow-400 focus:bg-white/10 focus:outline-none transition-all"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading || !isEmailValid()}
                className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-500/20"
              >
                {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <label className="block text-white/90 mb-3 text-sm font-medium text-center">Mã OTP</label>
                {/* 6 separate OTP input boxes */}
                <div className="flex gap-2 justify-center">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      value={otp[index] || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        if (!/^\d*$/.test(val)) return

                        if (val.length > 1) {
                          // Handle autofill
                          const pastedOtp = val.slice(0, 6).split('')
                          const newOtp = otp.split('')

                          pastedOtp.forEach((digit, i) => {
                            if (index + i < 6) {
                              newOtp[index + i] = digit
                            }
                          })

                          const finalOtp = newOtp.join('').slice(0, 6)
                          setOtp(finalOtp)

                          // Focus last filled
                          const nextIndex = Math.min(index + pastedOtp.length, 5)
                          document.getElementById(`otp-${nextIndex}`)?.focus()

                          // Auto submit if full
                          if (finalOtp.length === 6) {
                            verifyOtp(finalOtp)
                          }
                        } else {
                          // Single digit logic (existing)
                          const value = val
                          const newOtp = otp.split('')
                          newOtp[index] = value
                          const finalOtp = newOtp.join('')
                          setOtp(finalOtp)

                          if (value && index < 5) {
                            document.getElementById(`otp-${index + 1}`)?.focus()
                          }

                          if (finalOtp.length === 6 && index === 5) {
                            verifyOtp(finalOtp)
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[index] && index > 0) {
                          document.getElementById(`otp-${index - 1}`)?.focus()
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault()
                        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
                        setOtp(pastedData)
                        const lastIndex = Math.min(pastedData.length - 1, 5)
                        setTimeout(() => {
                          document.getElementById(`otp-${lastIndex}`)?.focus()
                        }, 0)
                      }}
                      className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-white/5 border-2 border-white/20 text-white focus:border-yellow-400 focus:bg-white/10 focus:outline-none transition-all"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-500/20"
              >
                {loading ? 'Đang xác thực...' : 'Xác nhận'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('input')
                  setOtp('')
                  setError('')
                }}
                className="w-full py-2 text-white/50 hover:text-white/80 transition-colors text-sm"
              >
                ← Đổi email
              </button>
            </form>
          )}

          {/* Footer hint */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-center text-white/40 text-xs">
              {step === 'otp' && debugOtp
                ? <span className="text-yellow-400">💡 Demo OTP: {debugOtp}</span>
                : '📧 Mã OTP sẽ được gửi đến email của bạn'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
