'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Snowflakes from '@/components/Snowflakes'
import BottomNavigation from '@/components/BottomNavigation'
import ProfileModal from '@/components/ProfileModal'

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

export default function GiftPage() {
    const router = useRouter()
    const [rewards, setRewards] = useState<Reward[]>([])
    const [redeemingReward, setRedeemingReward] = useState<string | null>(null)
    const [rewardSuccessMessages, setRewardSuccessMessages] = useState<Record<string, string>>({})
    const [showProfile, setShowProfile] = useState(false)
    const [activeTab, setActiveTab] = useState<'voucher' | 'gift'>('voucher')

    // Fetch user data
    const { data: authData, error: authError, mutate } = useSWR('/api/auth/me', (url) =>
        fetch(url).then((res) => res.json())
    )

    const user: User | null = authData?.user || null
    const isLoggedIn = !!user

    useEffect(() => {
        if (authError) {
            router.push('/')
        }
    }, [authError, router])

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

    const handleRedeemReward = async (reward: Reward) => {
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

                setTimeout(() => {
                    window.location.reload()
                }, 2000)
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

    if (!user) {
        return (
            <main className="min-h-screen relative overflow-hidden pb-20">
                <Snowflakes />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <div className="text-white text-sm">Đang tải...</div>
                </div>
                <BottomNavigation />
            </main>
        )
    }

    const renderRewardItem = (reward: Reward, index: number) => {
        const canAfford = user.total_score >= reward.points_required
        const isRedeeming = redeemingReward === reward.id
        const successMessage = rewardSuccessMessages[reward.id]
        const progress = Math.min(100, (user.total_score / reward.points_required) * 100)

        const getColor = () => {
            if (!canAfford) return 'bg-white/5'
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
                            {canAfford ? (
                                <span className="text-green-400 font-medium">Đủ điểm để đổi</span>
                            ) : reward.stock <= 0 ? (
                                <span className="text-red-400">Hết hàng</span>
                            ) : (
                                <span className="text-white/50">Thiếu {(reward.points_required - user.total_score).toLocaleString()} điểm</span>
                            )}
                        </div>

                        {!canAfford && reward.stock > 0 && (
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
        <main className="min-h-screen relative overflow-hidden pb-20">
            <Snowflakes />

            {/* Header */}
            <header className="relative z-10 py-4 px-4">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <button
                        onClick={() => router.push('/')}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 backdrop-blur-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-white">🎁 Quà Tặng</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center px-4 py-4">
                {/* User Points Card */}
                <div className="glass rounded-3xl p-4 max-w-md w-full mb-4">
                    <div className="text-center">
                        <p className="text-white/70 text-sm mb-1">Tổng điểm của bạn</p>
                        <p className="text-4xl font-black text-yellow-400">{user.total_score.toLocaleString()}</p>
                        <p className="text-white/50 text-xs mt-1">điểm</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="glass rounded-3xl p-2 max-w-md w-full mb-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('voucher')}
                            className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                                activeTab === 'voucher'
                                    ? 'bg-yellow-500 text-black'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                        >
                            🎟️ Voucher {vouchers.length > 0 && `(${vouchers.length})`}
                        </button>
                        <button
                            onClick={() => setActiveTab('gift')}
                            className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                                activeTab === 'gift'
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
                    <div className="glass rounded-3xl p-4 max-w-md w-full animate-in slide-in-from-right-2">
                        <h2 className="text-lg font-bold text-white mb-3 text-center">
                            🎟️ Đổi Voucher
                        </h2>

                        {vouchers.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-2 opacity-50">🎟️</div>
                                <p className="text-white/70">Chưa có voucher nào</p>
                                <p className="text-white/40 text-sm mt-1">Hãy quay lại sau nhé!</p>
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
                    <div className="glass rounded-3xl p-4 max-w-md w-full animate-in slide-in-from-left-2">
                        <h2 className="text-lg font-bold text-white mb-3 text-center">
                            🎁 Đổi Quà
                        </h2>

                        {gifts.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-2 opacity-50">🎁</div>
                                <p className="text-white/70">Chưa có quà tặng nào</p>
                                <p className="text-white/40 text-sm mt-1">Hãy quay lại sau nhé!</p>
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

                {/* How it works */}
                <div className="glass rounded-3xl p-4 max-w-md w-full mt-4">
                    <h2 className="text-lg font-bold text-white mb-3 text-center">
                        💡 Hướng dẫn
                    </h2>
                    <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-2 text-white/80 bg-white/5 p-2 rounded-lg">
                            <span className="text-yellow-400">1.</span>
                            <span>Chơi game để tích lũy điểm</span>
                        </div>
                        <div className="flex items-start gap-2 text-white/80 bg-white/5 p-2 rounded-lg">
                            <span className="text-yellow-400">2.</span>
                            <span>Đạt đủ điểm yêu cầu của voucher/quà</span>
                        </div>
                        <div className="flex items-start gap-2 text-white/80 bg-white/5 p-2 rounded-lg">
                            <span className="text-yellow-400">3.</span>
                            <span>Nhấn &quot;Đổi ngay&quot; để nhận quà</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Modal */}
            <ProfileModal
                isOpen={showProfile}
                onClose={() => setShowProfile(false)}
                user={user}
                onUserUpdate={mutate}
                onLogout={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' })
                    router.push('/')
                }}
            />

            {/* Bottom Navigation */}
            <BottomNavigation
                onProfileClick={() => setShowProfile(true)}
                onLoginClick={() => router.push('/')}
                isLoggedIn={isLoggedIn}
                showProfile={true}
            />
        </main>
    )
}
