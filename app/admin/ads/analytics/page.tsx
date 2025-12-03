'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface AdStat {
    placement_key: string
    total_impressions: number
    unique_users: number
    top_ads: {
        ad_content_id: string
        sponsor_name: string
        impressions: number
    }[]
}

export default function AdminAdsAnalyticsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const placementFilter = searchParams.get('placement')

    const [stats, setStats] = useState<AdStat[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [placementFilter])

    const fetchStats = async () => {
        try {
            const url = placementFilter
                ? `/api/ads/stats?placement_key=${placementFilter}`
                : '/api/ads/stats'

            const res = await fetch(url)
            const data = await res.json()
            setStats(data.stats || [])
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const getPlacementName = (key: string) => {
        const names: Record<string, string> = {
            ground_banner: '🎯 Banner Trên Ground',
            loading_screen: '⏳ Loading Screen',
            game_over: '🎮 Game Over',
            leaderboard: '🏆 Leaderboard',
            voucher_redemption: '🎁 Voucher Redemption'
        }
        return names[key] || key
    }

    const totalImpressions = stats.reduce((sum, stat) => sum + stat.total_impressions, 0)
    const totalUniqueUsers = Math.max(...stats.map(s => s.unique_users), 0)

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <button
                            onClick={() => router.push('/admin/ads')}
                            className="text-white/60 hover:text-white mb-2 flex items-center gap-2"
                        >
                            ← Quay lại
                        </button>
                        <h1 className="text-3xl font-bold text-white mb-2">📊 Analytics Quảng Cáo</h1>
                        <p className="text-white/60">Theo dõi hiệu quả quảng cáo</p>
                    </div>
                    {placementFilter && (
                        <button
                            onClick={() => router.push('/admin/ads/analytics')}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        >
                            Xem tất cả
                        </button>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
                        <div className="text-purple-300 text-sm mb-1">Tổng lượt hiển thị</div>
                        <div className="text-4xl font-bold text-white">{totalImpressions.toLocaleString()}</div>
                        <div className="text-purple-300/60 text-xs mt-2">Impressions</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
                        <div className="text-blue-300 text-sm mb-1">Người dùng unique</div>
                        <div className="text-4xl font-bold text-white">{totalUniqueUsers.toLocaleString()}</div>
                        <div className="text-blue-300/60 text-xs mt-2">Unique users</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
                        <div className="text-green-300 text-sm mb-1">Vị trí hoạt động</div>
                        <div className="text-4xl font-bold text-white">{stats.length}</div>
                        <div className="text-green-300/60 text-xs mt-2">Active placements</div>
                    </div>
                </div>

                {/* Stats by Placement */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-white/60">Đang tải...</div>
                    </div>
                ) : stats.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">📊</div>
                        <div className="text-white/60">Chưa có dữ liệu analytics</div>
                        <div className="text-white/40 text-sm mt-2">Dữ liệu sẽ xuất hiện khi có người xem quảng cáo</div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {stats.map((stat) => (
                            <div
                                key={stat.placement_key}
                                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                            >
                                {/* Placement Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-white">
                                        {getPlacementName(stat.placement_key)}
                                    </h3>
                                    <div className="flex gap-4 text-sm">
                                        <div className="text-right">
                                            <div className="text-white/60">Impressions</div>
                                            <div className="text-white font-bold text-lg">
                                                {stat.total_impressions.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-white/60">Unique users</div>
                                            <div className="text-white font-bold text-lg">
                                                {stat.unique_users.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Top Ads */}
                                {stat.top_ads.length > 0 && (
                                    <div>
                                        <h4 className="text-white/80 text-sm font-medium mb-3">Top quảng cáo:</h4>
                                        <div className="space-y-2">
                                            {stat.top_ads.map((ad, index) => (
                                                <div
                                                    key={ad.ad_content_id}
                                                    className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-500 text-black' :
                                                                index === 1 ? 'bg-gray-400 text-black' :
                                                                    index === 2 ? 'bg-orange-600 text-white' :
                                                                        'bg-white/10 text-white'
                                                            }`}>
                                                            {index + 1}
                                                        </div>
                                                        <div className="text-white font-medium">{ad.sponsor_name}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-white font-bold">{ad.impressions.toLocaleString()}</div>
                                                        <div className="text-white/50 text-xs">
                                                            {((ad.impressions / stat.total_impressions) * 100).toFixed(1)}%
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Info */}
                <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">💡</div>
                        <div>
                            <h4 className="text-white font-bold mb-1">Lưu ý</h4>
                            <ul className="text-white/70 text-sm space-y-1">
                                <li>• Impressions: Số lần quảng cáo được hiển thị</li>
                                <li>• Unique users: Số người dùng unique đã xem quảng cáo</li>
                                <li>• Dữ liệu được cập nhật realtime</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
