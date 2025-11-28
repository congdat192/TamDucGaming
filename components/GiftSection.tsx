'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
    id: string
    email: string | null
    phone: string | null
    name: string | null
    total_score: number
    bonus_plays: number
    plays_today: number
    referral_code: string
}

interface Reward {
    id: string
    name: string
    description: string
    type: 'voucher' | 'gift'
    value: number
    points_required: number
    image_url: string | null
    stock: number
}

interface RedemptionHistory {
    id: string
    points_used: number
    code: string | null
    status: string
    created_at: string
    reward: {
        name: string
        type: string
        value: number
    }
}

interface GiftSectionProps {
    user: User | null
    isLoggedIn: boolean
    onRedeemSuccess?: () => void
}

export default function GiftSection({ user, isLoggedIn, onRedeemSuccess }: GiftSectionProps) {
    const router = useRouter()
    const [rewards, setRewards] = useState<Reward[]>([])
    const [history, setHistory] = useState<RedemptionHistory[]>([])
    const [redeemingReward, setRedeemingReward] = useState<string | null>(null)
    const [rewardSuccessMessages, setRewardSuccessMessages] = useState<Record<string, string>>({})
    const [activeTab, setActiveTab] = useState<'voucher' | 'gift'>('voucher')

    useEffect(() => {
        const loadRewards = async () => {
            try {
                const res = await fetch('/api/rewards/list')
                const data = await res.json()
                setRewards(data.rewards || [])
            } catch (error) {
                console.error('Failed to load rewards:', error)
            }
        }
        loadRewards()
    }, [])

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const res = await fetch('/api/rewards/history')
                const data = await res.json()
                setHistory(data.history || [])
            } catch (error) {
                console.error('Failed to load history:', error)
            }
        }
        if (isLoggedIn && user) {
            loadHistory()
        } else {
            setHistory([])
        }
    }, [isLoggedIn, user])

    const handleRedeemReward = async (reward: Reward) => {
        if (!isLoggedIn) {
            router.push('/?login=true') // Or handle login request
            return
        }

        setRedeemingReward(reward.id)
        setRewardSuccessMessages(prev => ({ ...prev, [reward.id]: '' }))

        try {
            const res = await fetch('/api/rewards/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rewardId: reward.id })
            })

            const data = await res.json()

            if (data.success) {
                setRewardSuccessMessages(prev => ({
                    ...prev,
                    [reward.id]: data.message
                }))

                if (onRedeemSuccess) {
                    onRedeemSuccess()
                }

                // Refresh history
                const historyRes = await fetch('/api/rewards/history')
                const historyData = await historyRes.json()
                setHistory(historyData.history || [])

            } else {
                alert(data.error || 'Không thể đổi quà')
            }
        } catch (error) {
            console.error('Failed to redeem reward:', error)
            alert('Đã xảy ra lỗi')
        } finally {
            setRedeemingReward(null)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
    }

    // Filter rewards by type - sort by points_required ascending (lowest first)
    const vouchers = rewards.filter(r => r.type === 'voucher').sort((a, b) => a.points_required - b.points_required)
    const gifts = rewards.filter(r => r.type === 'gift').sort((a, b) => a.points_required - b.points_required)

    const renderRewardItem = (reward: Reward, index: number) => {
        const userScore = user?.total_score || 0
        const canAfford = isLoggedIn && userScore >= reward.points_required
        const isRedeeming = redeemingReward === reward.id
        const successMessage = rewardSuccessMessages[reward.id]
        const progress = isLoggedIn ? Math.min(100, (userScore / reward.points_required) * 100) : 0

        const getColor = () => {
            if (!canAfford && isLoggedIn) return 'bg-white/5'
            if (!isLoggedIn) return 'bg-white/5'
            if (index === 0) return 'bg-gradient-to-r from-yellow-500/30 to-yellow-600/30'
            if (index === 1) return 'bg-gradient-to-r from-gray-400/30 to-gray-500/30'
            if (index === 2) return 'bg-gradient-to-r from-orange-500/30 to-orange-600/30'
            return 'bg-white/10'
        }

        const getIcon = () => {
            if (reward.type === 'voucher') {
                if (reward.value >= 150000) return '💎'
                if (reward.value >= 100000) return '🏆'
                return '🎫'
            }
            return '🎁'
        }

        return (
            <div
                key={reward.id}
                className={`p-3 rounded-xl ${getColor()} ${canAfford ? 'border border-green-400/30' : 'border border-white/10'}`}
            >
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl shrink-0">
                        {getIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-white font-bold text-base">{reward.name}</span>
                            {reward.value > 0 && (
                                <span className="text-yellow-400 font-black text-lg">
                                    {formatCurrency(reward.value)}
                                </span>
                            )}
                        </div>
                        {reward.description && (
                            <p className="text-white/50 text-xs mb-2 line-clamp-2">{reward.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-yellow-400/80 font-medium">{reward.points_required.toLocaleString()} điểm</span>
                            {isLoggedIn ? (
                                canAfford ? (
                                    <span className="text-green-400 font-medium">Đủ điểm để đổi</span>
                                ) : reward.stock <= 0 ? (
                                    <span className="text-red-400">Hết hàng</span>
                                ) : (
                                    <span className="text-white/50">Thiếu {(reward.points_required - userScore).toLocaleString()} điểm</span>
                                )
                            ) : (
                                <span className="text-white/50">Đăng nhập để đổi</span>
                            )}
                        </div>

                        {isLoggedIn && !canAfford && reward.stock > 0 && (
                            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}

                        {canAfford && reward.stock > 0 && !successMessage && (
                            <button
                                onClick={() => handleRedeemReward(reward)}
                                disabled={isRedeeming}
                                className="w-full mt-2 py-2 rounded-lg font-bold text-sm bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all active:scale-95"
                            >
                                {isRedeeming ? 'Đang đổi...' : '🎁 Đổi ngay'}
                            </button>
                        )}

                        {successMessage && (
                            <p className="text-green-400 text-xs text-center mt-2 animate-pulse">
                                ✅ {successMessage}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full">
            {/* Tabs */}
            <div className="glass rounded-3xl p-2 max-w-md w-full mb-4 mx-auto">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('voucher')}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${activeTab === 'voucher'
                            ? 'bg-yellow-500 text-black'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                    >
                        🎟️ Voucher {vouchers.length > 0 && `(${vouchers.length})`}
                    </button>
                    <button
                        onClick={() => setActiveTab('gift')}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${activeTab === 'gift'
                            ? 'bg-yellow-500 text-black'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                    >
                        🎁 Quà tặng {gifts.length > 0 && `(${gifts.length})`}
                    </button>
                </div>
            </div>

            {/* Voucher Tab */}
            {activeTab === 'voucher' && (
                <div className="glass rounded-3xl p-4 max-w-md w-full mx-auto animate-in slide-in-from-right-2">
                    <h2 className="text-lg font-bold text-white mb-3 text-center">
                        🎟️ Đổi Voucher
                    </h2>

                    {vouchers.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-2 opacity-50">🎟️</div>
                            <p className="text-white/70">Chưa có voucher nào</p>
                            <p className="text-white/40 text-sm mt-1 mb-4">Hãy quay lại sau nhé!</p>
                            <button
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full text-sm transition-all shadow-lg shadow-yellow-500/20 active:scale-95"
                            >
                                🎮 Chơi game ngay
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {vouchers.map((reward, index) => renderRewardItem(reward, index))}
                        </div>
                    )}

                    <div className="mt-4 text-center text-white/50 text-[10px]">
                        <p>Voucher sẽ được gửi qua email của bạn</p>
                        <p>Điểm sẽ bị trừ sau khi đổi voucher</p>
                    </div>
                </div>
            )}

            {/* Gifts Tab */}
            {activeTab === 'gift' && (
                <div className="glass rounded-3xl p-4 max-w-md w-full mx-auto animate-in slide-in-from-left-2">
                    <h2 className="text-lg font-bold text-white mb-3 text-center">
                        🎁 Đổi Quà
                    </h2>

                    {gifts.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-2 opacity-50">🎁</div>
                            <p className="text-white/70">Chưa có quà tặng nào</p>
                            <p className="text-white/40 text-sm mt-1 mb-4">Hãy quay lại sau nhé!</p>
                            <button
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full text-sm transition-all shadow-lg shadow-yellow-500/20 active:scale-95"
                            >
                                🎮 Chơi game ngay
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {gifts.map((reward, index) => renderRewardItem(reward, index))}
                        </div>
                    )}

                    <div className="mt-4 text-center text-white/50 text-[10px]">
                        <p>Quà tặng vật lý sẽ được giao đến bạn</p>
                        <p>Điểm sẽ bị trừ sau khi đổi quà</p>
                    </div>
                </div>
            )}

            {/* Redemption History - Only show if logged in and has history */}
            {isLoggedIn && (
                <div className="glass rounded-3xl p-4 max-w-md w-full mt-4 mx-auto">
                    <h2 className="text-lg font-bold text-white mb-3 text-center">
                        📜 Lịch sử đổi quà
                    </h2>

                    {history.length === 0 ? (
                        <div className="text-center py-8 text-white/40">
                            <div className="text-4xl mb-2 opacity-50">📭</div>
                            <p className="text-sm">Chưa có lịch sử đổi quà</p>
                            <p className="text-xs mt-1">Hãy tích điểm và đổi quà nhé!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {history.map((item) => (
                                <div key={item.id} className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-white font-bold text-sm">{item.reward.name}</p>
                                            <p className="text-white/50 text-xs mt-0.5">
                                                {new Date(item.created_at).toLocaleDateString('vi-VN')} • {item.points_used.toLocaleString()} điểm
                                            </p>
                                            {item.code && (
                                                <div className="mt-2 bg-white/10 rounded-lg p-2">
                                                    <p className="text-white/60 text-[10px] mb-1">Mã voucher:</p>
                                                    <p className="text-yellow-400 font-mono font-bold text-sm">{item.code}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right ml-3">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.status === 'completed'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {item.status === 'completed' ? 'Hoàn tất' : 'Chờ xử lý'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
