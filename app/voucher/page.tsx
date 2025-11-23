'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { getGameConfig, type GameConfig, type VoucherTier, getAvailableVouchers } from '@/lib/gameConfig'
import BottomNavigation from '@/components/BottomNavigation'

interface User {
    id: string
    email: string | null
    phone: string | null
    total_score: number
    bonus_plays: number
    plays_today: number
    referral_code: string
}

export default function VoucherPage() {
    const router = useRouter()
    const [config, setConfig] = useState<GameConfig | null>(null)
    const [availableVouchers, setAvailableVouchers] = useState<VoucherTier[]>([])
    const [redeeming, setRedeeming] = useState<number | null>(null)
    const [successMessages, setSuccessMessages] = useState<Record<number, string>>({})

    // Fetch user data
    const { data: authData, error: authError } = useSWR('/api/auth/me', (url) =>
        fetch(url).then((res) => res.json())
    )

    const user: User | null = authData?.user || null

    useEffect(() => {
        if (authError) {
            router.push('/')
        }
    }, [authError, router])

    useEffect(() => {
        const loadConfig = async () => {
            const gameConfig = await getGameConfig()
            setConfig(gameConfig)

            if (user) {
                const available = getAvailableVouchers(gameConfig, user.total_score)
                setAvailableVouchers(available)
            }
        }
        if (user) {
            loadConfig()
        }
    }, [user])

    const handleRedeemVoucher = async (voucherTier: VoucherTier) => {
        if (!user?.email) {
            alert('Bạn cần có email để nhận voucher!')
            return
        }

        setRedeeming(voucherTier.minScore)
        setSuccessMessages(prev => ({ ...prev, [voucherTier.minScore]: '' }))

        try {
            const res = await fetch('/api/voucher/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ minScore: voucherTier.minScore })
            })

            const data = await res.json()

            if (data.success && data.voucher) {
                setSuccessMessages(prev => ({
                    ...prev,
                    [voucherTier.minScore]: `✅ Voucher đã được gửi đến ${user.email}`
                }))

                // Refresh user data to update total_score
                setTimeout(() => {
                    window.location.reload()
                }, 2000)
            } else {
                alert(data.error || 'Không thể đổi voucher')
            }
        } catch (error) {
            console.error('Failed to redeem voucher:', error)
            alert('Đã xảy ra lỗi')
        } finally {
            setRedeeming(null)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
    }

    if (!user || !config) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
                <p className="text-white">Đang tải...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-6 text-center">
                <h1 className="text-3xl font-black text-black mb-2">🎁 ĐỔI VOUCHER</h1>
                <p className="text-black/70 text-sm">Sử dụng điểm để đổi voucher</p>
            </div>

            {/* User Points */}
            <div className="p-4">
                <div className="glass rounded-2xl p-6 text-center border border-white/10">
                    <p className="text-white/70 text-sm mb-2">Tổng điểm của bạn</p>
                    <p className="text-5xl font-black text-yellow-400">{user.total_score}</p>
                    <p className="text-white/50 text-xs mt-2">điểm</p>
                </div>
            </div>

            {/* Voucher List */}
            <div className="p-4 space-y-4">
                <h2 className="text-white font-bold text-lg mb-3">Danh sách voucher</h2>

                {config.voucherTiers.map((voucher) => {
                    const canAfford = user.total_score >= voucher.minScore
                    const isRedeeming = redeeming === voucher.minScore
                    const successMessage = successMessages[voucher.minScore]

                    return (
                        <div
                            key={voucher.minScore}
                            className={`glass rounded-2xl p-5 border ${canAfford ? 'border-green-400/30' : 'border-white/10'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-white font-bold text-xl">{voucher.label}</h3>
                                    <p className="text-white/60 text-sm">Cần {voucher.minScore} điểm</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-yellow-400 font-black text-2xl">
                                        {formatCurrency(voucher.value)}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleRedeemVoucher(voucher)}
                                disabled={!canAfford || isRedeeming || !!successMessage}
                                className={`w-full py-3 rounded-xl font-bold transition-all ${canAfford && !successMessage
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                                    }`}
                            >
                                {isRedeeming ? 'Đang đổi...' : successMessage ? 'Đã đổi' : canAfford ? 'Đổi ngay' : '🔒 Chưa đủ điểm'}
                            </button>

                            {successMessage && (
                                <p className="text-green-400 text-sm text-center mt-3 animate-pulse">
                                    {successMessage}
                                </p>
                            )}
                        </div>
                    )
                })}
            </div>

            <BottomNavigation />
        </div>
    )
}
