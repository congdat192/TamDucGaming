'use client'

import { useState, useEffect } from 'react'

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

export default function AddPhoneModal({ isOpen, onClose, onSuccess }: AddPhoneModalProps) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

  if (!isOpen || !modalContent) return null

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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

          <form onSubmit={handleSubmit} className="space-y-4">
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
              {loading ? 'ĐANG XỬ LÝ...' : modalContent.buttonText}
            </button>
          </form>

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
