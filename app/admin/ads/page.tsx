'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { AdPlacement } from '@/types/ads'

export default function AdminAdsPage() {
    const router = useRouter()
    const [placements, setPlacements] = useState<AdPlacement[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPlacements()
    }, [])

    const fetchPlacements = async () => {
        try {
            const res = await fetch('/api/ads/placements')
            const data = await res.json()
            setPlacements(data.placements || [])
        } catch (error) {
            console.error('Failed to fetch placements:', error)
        } finally {
            setLoading(false)
        }
    }

    const togglePlacement = async (placement: AdPlacement) => {
        try {
            const res = await fetch('/api/ads/placements', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: placement.id,
                    is_enabled: !placement.is_enabled
                })
            })

            if (res.ok) {
                fetchPlacements()
            }
        } catch (error) {
            console.error('Failed to toggle placement:', error)
        }
    }

    const getPlacementIcon = (key: string) => {
        switch (key) {
            case 'ground_banner': return '🎯'
            case 'loading_screen': return '⏳'
            case 'game_over': return '🎮'
            case 'leaderboard': return '🏆'
            case 'voucher_redemption': return '🎁'
            default: return '📍'
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">📢 Quản Lý Quảng Cáo</h1>
                        <p className="text-white/60">Quản lý vị trí và nội dung quảng cáo trong game</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/admin/ads/analytics')}
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                        >
                            📊 Analytics
                        </button>
                        <button
                            onClick={() => router.push('/admin')}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        >
                            ← Quay lại
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                        <div className="text-white/60 text-sm mb-1">Tổng vị trí</div>
                        <div className="text-3xl font-bold text-white">{placements.length}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                        <div className="text-white/60 text-sm mb-1">Đang hoạt động</div>
                        <div className="text-3xl font-bold text-green-400">
                            {placements.filter(p => p.is_enabled).length}
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                        <div className="text-white/60 text-sm mb-1">Tạm dừng</div>
                        <div className="text-3xl font-bold text-orange-400">
                            {placements.filter(p => !p.is_enabled).length}
                        </div>
                    </div>
                </div>

                {/* Placements Table */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-white/60">Đang tải...</div>
                    </div>
                ) : (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Vị trí</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Mô tả</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-white/80">Trạng thái</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-white/80">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {placements.map((placement, index) => (
                                    <tr
                                        key={placement.id}
                                        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${index % 2 === 0 ? 'bg-white/[0.02]' : ''
                                            }`}
                                    >
                                        {/* Vị trí */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="text-3xl">{getPlacementIcon(placement.placement_key)}</div>
                                                <div>
                                                    <div className="text-white font-semibold">{placement.title}</div>
                                                    <div className="text-white/40 text-xs">#{placement.placement_key}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Mô tả */}
                                        <td className="px-6 py-4">
                                            <div className="text-white/70 text-sm max-w-md">{placement.description}</div>
                                        </td>

                                        {/* Trạng thái */}
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => togglePlacement(placement)}
                                                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none ${placement.is_enabled
                                                    ? 'bg-green-500 hover:bg-green-600'
                                                    : 'bg-gray-600 hover:bg-gray-700'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${placement.is_enabled ? 'translate-x-9' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                            <div className={`text-xs mt-1 font-medium ${placement.is_enabled ? 'text-green-400' : 'text-gray-400'
                                                }`}>
                                                {placement.is_enabled ? 'Bật' : 'Tắt'}
                                            </div>
                                        </td>

                                        {/* Thao tác */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {placement.placement_key === 'leaderboard' ? (
                                                    // Special button for Leaderboard - 4 logos config
                                                    <button
                                                        onClick={() => router.push('/admin/ads/leaderboard-config')}
                                                        className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg text-sm font-bold transition-colors shadow-lg"
                                                    >
                                                        ⚙️ Cấu hình 4 Logos
                                                    </button>
                                                ) : placement.placement_key === 'voucher_redemption' ? (
                                                    // Special button for Voucher Redemption - 4 logos config
                                                    <button
                                                        onClick={() => router.push('/admin/ads/voucher-config')}
                                                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-sm font-bold transition-colors shadow-lg"
                                                    >
                                                        ⚙️ Cấu hình 4 Logos
                                                    </button>
                                                ) : placement.placement_key === 'ground_banner' ? (
                                                    // Special button for Ground Banner - 4 logos config
                                                    <button
                                                        onClick={() => router.push('/admin/ads/ground-config')}
                                                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg text-sm font-bold transition-colors shadow-lg"
                                                    >
                                                        ⚙️ Cấu hình 4 Logos
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => router.push(`/admin/ads/${placement.id}`)}
                                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        📝 Quản lý nội dung
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => router.push(`/admin/ads/analytics?placement=${placement.placement_key}`)}
                                                    className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    📊
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Help Text */}
                <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">💡</div>
                        <div>
                            <h4 className="text-white font-bold mb-1">Hướng dẫn</h4>
                            <ul className="text-white/70 text-sm space-y-1">
                                <li>• Click "Quản lý nội dung" để thêm/sửa/xóa quảng cáo cho từng vị trí</li>
                                <li>• Bật/tắt toggle để hiển thị hoặc ẩn tất cả quảng cáo tại vị trí đó</li>
                                <li>• Khi tắt, tất cả quảng cáo ở vị trí đó sẽ không hiển thị trong game</li>
                                <li>• Xem Analytics để theo dõi hiệu quả quảng cáo</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
