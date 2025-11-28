'use client'

import { useState, useEffect, useRef } from 'react'

interface ModalContentData {
  title: string
  subtitle: string
  buttonText: string
  icon: string
  badge: string
}

interface GameConfig {
  bonusPlaysForPhone: number
}

interface AddPhoneModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type Step = 'phone' | 'otp'

export default function AddPhoneModal({ isOpen, onClose, onSuccess }: AddPhoneModalProps) {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [modalContent, setModalContent] = useState<ModalContentData | null>(null)
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null)

  useEffect(() => {
    const loadContent = async () => {
      try {
        // Load modal content
        const contentRes = await fetch('/api/modal-content')
        const contentData = await contentRes.json()
        if (contentData.content?.addPhoneModal) {
          setModalContent(contentData.content.addPhoneModal)
        }

        // Load game config for dynamic bonus value
        const configRes = await fetch('/api/config/public')
        const configData = await configRes.json()
        if (configData.config) {
          setGameConfig({
            bonusPlaysForPhone: configData.config.bonusPlaysForPhone
          })
        }
      } catch (err) {
        console.error('Failed to load modal content:', err)
        // Use defaults if API fails
        setModalContent({
          title: 'Nhận thêm lượt chơi',
          subtitle: 'Cập nhật số điện thoại của bạn để nhận thêm lượt chơi',
          buttonText: '🎁 CẬP NHẬT SỐ ĐIỆN THOẠI',
          icon: '🎮',
          badge: '+ 4 lượt chơi',
        })
        setGameConfig({
          bonusPlaysForPhone: 4
        })
      }
    }
    loadContent()
  }, [])

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // OTP Input Logic
  const otpInputs = useRef<(HTMLInputElement | null)[]>([])

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return

    const newOtp = otp.split('')
    newOtp[index] = value
    const newOtpStr = newOtp.join('').slice(0, 6)
    setOtp(newOtpStr)

    // Auto focus next input if value entered
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current is empty, move back and delete previous
        const newOtp = otp.split('')
        newOtp[index - 1] = ''
        setOtp(newOtp.join(''))
        otpInputs.current[index - 1]?.focus()
      }
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData) {
      setOtp(pastedData)
      // Focus last filled input or first empty
      const nextIndex = Math.min(pastedData.length, 5)
      otpInputs.current[nextIndex]?.focus()
    }
  }

  if (!isOpen || !modalContent) return null

  // Step 1: Send OTP to phone
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()

    if (phone.length < 10) {
      setError('Số điện thoại phải có ít nhất 10 số')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, checkUnique: true })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Không thể gửi OTP')
      }

      // Move to OTP step
      setStep('otp')
      setCountdown(60) // 60s before can resend
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
    } finally {
      setLoading(false)
    }
  }



  // Step 2: Verify OTP and add phone bonus
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()

    if (otp.length < 4) {
      setError('Vui lòng nhập mã OTP')
      return
    }

    setError('')
    setLoading(true)

    try {
      // Verify OTP and update phone in one call
      const res = await fetch('/api/user/add-phone-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Không thể xác thực OTP')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, checkUnique: true })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Không thể gửi lại OTP')
      }

      setCountdown(60)
      setOtp('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPhone('')
    setOtp('')
    setError('')
    setStep('phone')
    setCountdown(0)
    onClose()
  }

  const handleBack = () => {
    setStep('phone')
    setOtp('')
    setError('')
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="glass rounded-3xl p-8 max-w-sm w-full border border-white/10 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-12 bg-yellow-500/20 blur-3xl rounded-full -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 p-12 bg-red-500/20 blur-3xl rounded-full -ml-10 -mb-10"></div>

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative z-10 text-center">
          {/* Hero Icon */}
          <div className="mb-6 relative inline-block">
            <div className="text-7xl animate-bounce">{modalContent.icon}</div>
            <div className="absolute -bottom-2 -right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white shadow-lg rotate-12 whitespace-nowrap">
              + {gameConfig?.bonusPlaysForPhone || 4} lượt chơi
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {modalContent.title}
          </h2>

          <p className="text-white/70 mb-6 text-sm">
            {modalContent.subtitle}
          </p>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-xl mb-4 text-xs">
              {error}
            </div>
          )}

          {/* Step 1: Enter Phone */}
          {step === 'phone' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập số điện thoại..."
                  className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:border-yellow-400 focus:bg-white/10 focus:outline-none text-lg text-center transition-all"
                  maxLength={10}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-lg rounded-xl hover:from-yellow-300 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-lg shadow-yellow-400/20"
              >
                {loading ? 'ĐANG GỬI OTP...' : 'GỬI MÃ XÁC THỰC'}
              </button>
            </form>
          )}

          {/* Step 2: Enter OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <p className="text-white/60 text-sm mb-2">
                Mã OTP sẽ được gửi đến <span className="font-bold text-blue-400">ZALO</span> hoặc <span className="font-bold text-green-400">SMS</span> của số <span className="text-yellow-400 font-medium">{phone}</span>
              </p>

              <div className="flex gap-2 justify-center mb-6">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      if (el) otpInputs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[index] || ''}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="w-10 h-12 sm:w-12 sm:h-14 rounded-lg bg-white/5 border border-white/20 text-white text-center text-xl font-bold focus:border-yellow-400 focus:bg-white/10 focus:outline-none transition-all"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-lg rounded-xl hover:from-yellow-300 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-lg shadow-yellow-400/20"
              >
                {loading ? 'ĐANG XÁC THỰC...' : modalContent.buttonText}
              </button>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-white/50 hover:text-white/80 transition-colors"
                >
                  ← Đổi số điện thoại
                </button>

                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || loading}
                  className="text-yellow-400 hover:text-yellow-300 disabled:text-white/30 disabled:cursor-not-allowed transition-colors"
                >
                  {countdown > 0 ? `Gửi lại (${countdown}s)` : 'Gửi lại OTP'}
                </button>
              </div>
            </form>
          )}

          <button
            onClick={handleClose}
            className="mt-4 text-white/40 hover:text-white/60 text-xs font-medium transition-colors"
          >
            Để sau, tôi sẽ cập nhật sau
          </button>
        </div>
      </div>
    </div>
  )
}
