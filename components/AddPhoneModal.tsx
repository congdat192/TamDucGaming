'use client'

import { useState } from 'react'

interface AddPhoneModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddPhoneModal({ isOpen, onClose, onSuccess }: AddPhoneModalProps) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (phone.length < 10) {
      setError('Số điện thoại phải có ít nhất 10 số')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/user/add-phone-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Không thể cập nhật số điện thoại')
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
    setPhone('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="relative bg-gradient-to-b from-green-800 to-green-900 rounded-3xl p-6 max-w-md w-full border-4 border-yellow-400 shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl w-8 h-8 flex items-center justify-center"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3 animate-bounce">🎁</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            HẾT LƯỢT CHƠI!
          </h2>
          <p className="text-green-200">
            Cập nhật số điện thoại để nhận ngay
          </p>
          <div className="mt-3 inline-block bg-yellow-500/30 border-2 border-yellow-400 rounded-xl px-4 py-2">
            <span className="text-yellow-400 font-bold text-xl">+3 LƯỢT CHƠI MIỄN PHÍ</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded-lg mb-4 text-center text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2 font-semibold">
              Số điện thoại của bạn
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="VD: 0912345678"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-yellow-400/50 text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none text-lg text-center"
              maxLength={10}
              required
              autoFocus
            />
            <p className="text-white/60 text-xs mt-2 text-center">
              Số điện thoại sẽ được sử dụng để liên hệ khi bạn đổi quà
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || phone.length < 10}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-xl rounded-xl hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
          >
            {loading ? 'ĐANG XỬ LÝ...' : '🎁 NHẬN 3 LƯỢT CHƠI'}
          </button>
        </form>

        {/* Skip option */}
        <div className="mt-4 text-center">
          <button
            onClick={handleClose}
            className="text-white/50 hover:text-white/70 text-sm underline transition-colors"
          >
            Để sau, tôi sẽ mời bạn bè
          </button>
        </div>

        {/* Benefits */}
        <div className="mt-4 bg-black/20 rounded-xl p-3">
          <p className="text-white/70 text-xs text-center mb-2">Lợi ích khi cập nhật số điện thoại:</p>
          <ul className="text-green-300 text-xs space-y-1">
            <li className="flex items-center gap-2">
              <span>✓</span>
              <span>Nhận ngay 3 lượt chơi miễn phí</span>
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span>
              <span>Dễ dàng liên hệ khi đổi voucher</span>
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span>
              <span>Nhận thông báo khuyến mãi đặc biệt</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
