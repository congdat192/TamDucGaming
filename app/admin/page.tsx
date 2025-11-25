'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    // Check if already logged in via API
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/verify')
        const data = await res.json()

        if (data.isAdmin) {
          router.push('/admin/dashboard')
        } else {
          setLoading(false)
        }
      } catch {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/admin/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (data.success) {
        setStep('otp')
        setCountdown(60) // 60s cooldown
        // If debug OTP is returned (dev mode), auto fill or log it
        if (data.debug_otp) {
          console.log('Debug OTP:', data.debug_otp)
        }
      } else {
        setError(data.error || 'Không thể gửi OTP')
      }
    } catch {
      setError('Đã xảy ra lỗi kết nối')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/admin/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })

      const data = await res.json()

      if (data.success) {
        // Wait for cookie to be set before redirecting
        setTimeout(() => {
          window.location.href = '/admin/dashboard'
        }, 200)
      } else {
        setError(data.error || 'Mã OTP không đúng')
      }
    } catch {
      setError('Đã xảy ra lỗi kết nối')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/admin/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (data.success) {
        setCountdown(60)
        setError('')
        alert('Đã gửi lại mã OTP')
      } else {
        setError(data.error || 'Không thể gửi lại OTP')
      }
    } catch {
      setError('Đã xảy ra lỗi')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🎅 Admin Panel</h1>
          <p className="text-gray-400">Đăng nhập quản trị viên</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label className="block text-gray-300 mb-2 text-sm">Email Admin</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@example.com"
                required
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {submitting ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-300 text-sm">Mã OTP</label>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Đổi email
                </button>
              </div>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest text-xl"
                placeholder="123456"
                maxLength={6}
                required
                disabled={submitting}
              />
              <p className="text-gray-400 text-xs mt-2 text-center">
                Mã OTP đã được gửi đến {email}
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
            >
              {submitting ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={countdown > 0 || submitting}
                className="text-sm text-gray-400 hover:text-white disabled:opacity-50"
              >
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã OTP'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
