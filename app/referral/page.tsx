'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Snowflakes from '@/components/Snowflakes'

interface ReferralData {
  referralCode: string
  referralLink: string
  totalReferrals: number
  successfulReferrals: number
  bonusPlays: number
}

export default function ReferralPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReferralData | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchReferralData()
  }, [])

  const fetchReferralData = async () => {
    try {
      const res = await fetch('/api/referral')
      if (!res.ok) {
        router.push('/')
        return
      }
      const referralData = await res.json()
      setData(referralData)
    } catch (error) {
      console.error('Failed to fetch referral data:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (data) {
      navigator.clipboard.writeText(data.referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = () => {
    if (!data) return

    const text = `🎅 Chơi Santa Jump và nhận voucher từ Mắt Kính Tâm Đức! Dùng link của tôi để cả hai cùng có lượt chơi thêm:`

    if (navigator.share) {
      navigator.share({
        title: 'Santa Jump - Mắt Kính Tâm Đức',
        text,
        url: data.referralLink
      })
    } else {
      navigator.clipboard.writeText(`${text}\n${data.referralLink}`)
      alert('Đã copy link chia sẻ!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Đang tải...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <Snowflakes />

      {/* Header */}
      <header className="relative z-10 py-4 px-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-white/70 hover:text-white transition-colors"
          >
            ← Quay lại
          </button>
          <h1 className="text-xl font-bold text-white">👥 Giới Thiệu Bạn</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 py-8">
        <div className="glass rounded-3xl p-6 max-w-md w-full">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center bg-white/10 rounded-xl p-3">
              <div className="text-3xl font-bold text-yellow-400">
                {data?.totalReferrals || 0}
              </div>
              <div className="text-xs text-white/70">Đã mời</div>
            </div>
            <div className="text-center bg-white/10 rounded-xl p-3">
              <div className="text-3xl font-bold text-green-400">
                {data?.successfulReferrals || 0}
              </div>
              <div className="text-xs text-white/70">Thành công</div>
            </div>
            <div className="text-center bg-white/10 rounded-xl p-3">
              <div className="text-3xl font-bold text-blue-400">
                {data?.bonusPlays || 0}
              </div>
              <div className="text-xs text-white/70">Lượt bonus</div>
            </div>
          </div>

          {/* Referral Code */}
          <div className="mb-6">
            <label className="block text-white/70 text-sm mb-2">
              Mã giới thiệu của bạn
            </label>
            <div className="bg-white/20 rounded-xl p-4 text-center">
              <code className="text-2xl font-bold text-yellow-400 tracking-wider">
                {data?.referralCode}
              </code>
            </div>
          </div>

          {/* Referral Link */}
          <div className="mb-6">
            <label className="block text-white/70 text-sm mb-2">
              Link giới thiệu
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={data?.referralLink || ''}
                readOnly
                className="flex-1 px-3 py-2 bg-white/10 rounded-xl text-white text-sm truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors text-sm"
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold text-xl rounded-xl hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-lg mb-6"
          >
            📤 CHIA SẺ NGAY
          </button>

          {/* How it works */}
          <div className="bg-white/10 rounded-xl p-4">
            <h3 className="text-white font-bold mb-3">📖 Cách thức hoạt động</h3>
            <ol className="space-y-2 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs">1</span>
                <span>Chia sẻ link giới thiệu cho bạn bè</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs">2</span>
                <span>Bạn bè đăng ký qua link của bạn</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs">3</span>
                <span>Khi bạn bè hoàn thành lượt chơi đầu tiên</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs">✓</span>
                <span>Bạn nhận được <strong className="text-yellow-400">+1 lượt chơi bonus</strong></span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  )
}
