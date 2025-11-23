'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Snowflakes from '@/components/Snowflakes'
import BottomNavigation from '@/components/BottomNavigation'
import { useBGM } from '@/hooks/useBGM'

interface LeaderboardEntry {
    rank: number
    phone: string | null
    email: string | null
    totalScore: number
    gamesPlayed: number
}

type Period = 'week' | 'month' | 'campaign' | 'all'

export default function LeaderboardAllPage() {
    const router = useRouter()

    // Background music
    const bgm = useBGM('leaderboard')
    const [loading, setLoading] = useState(true)
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [period, setPeriod] = useState<Period>('all')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20 // Show more items per page in table view

    useEffect(() => {
        fetchLeaderboard()

        // Polling every 60 seconds
        const interval = setInterval(() => {
            fetchLeaderboard(true)
        }, 60000)

        return () => clearInterval(interval)
    }, [period])

    const fetchLeaderboard = async (isBackground = false) => {
        if (!isBackground) setLoading(true)
        try {
            // Fetch more items for the "View All" page, e.g., top 100
            const res = await fetch(`/api/leaderboard?period=${period}&limit=100`, { cache: 'no-store' })
            const data = await res.json()
            setLeaderboard(data.leaderboard || [])
            if (!isBackground) setCurrentPage(1)
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error)
        } finally {
            if (!isBackground) setLoading(false)
        }
    }

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1: return 'text-yellow-400'
            case 2: return 'text-gray-300'
            case 3: return 'text-orange-400'
            default: return 'text-white'
        }
    }

    // Pagination logic
    const totalPages = Math.ceil(leaderboard.length / itemsPerPage)
    const currentData = leaderboard.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    return (
        <main className="min-h-screen relative overflow-hidden pb-20 bg-[#0f172a]">
            <Snowflakes />

            {/* Header */}
            <header className="relative z-10 py-4 px-4 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-md sticky top-0">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 backdrop-blur-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <h1 className="text-lg font-bold text-white">Bảng Xếp Hạng Chi Tiết</h1>
                    <div className="w-20"></div>
                </div>
            </header>

            {/* Content */}
            <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">
                {/* Period Tabs */}
                <div className="flex justify-center gap-2 mb-6 overflow-x-auto no-scrollbar">
                    {(['all', 'week', 'month'] as Period[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${period === p
                                ? 'bg-yellow-500 text-black'
                                : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            {p === 'all' && 'Tất cả'}
                            {p === 'week' && 'Tuần này'}
                            {p === 'month' && 'Tháng này'}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-white/70 text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-center w-16">Hạng</th>
                                    <th className="px-4 py-3 font-medium">Người chơi</th>
                                    <th className="px-4 py-3 font-medium text-right">Điểm số</th>
                                    <th className="px-4 py-3 font-medium text-right">Lượt chơi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-white/50">
                                            Đang tải dữ liệu...
                                        </td>
                                    </tr>
                                ) : leaderboard.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-white/50">
                                            Chưa có dữ liệu
                                        </td>
                                    </tr>
                                ) : (
                                    currentData.map((entry) => (
                                        <tr key={entry.rank} className="hover:bg-white/5 transition-colors">
                                            <td className={`px-4 py-3 text-center font-bold ${getRankColor(entry.rank)}`}>
                                                #{entry.rank}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-white font-medium text-sm">
                                                    {entry.phone || '******'}
                                                </div>
                                                {entry.email && (
                                                    <div className="text-white/50 text-xs">
                                                        {entry.email}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-yellow-400 font-bold">
                                                {entry.totalScore.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-right text-white/70 text-sm">
                                                {entry.gamesPlayed}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {!loading && leaderboard.length > 0 && (
                    <div className="flex justify-center items-center gap-4 mt-6">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm disabled:opacity-30 hover:bg-white/20 transition-colors"
                        >
                            Trước
                        </button>
                        <span className="text-white/70 text-sm font-medium">
                            Trang {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm disabled:opacity-30 hover:bg-white/20 transition-colors"
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>

            <BottomNavigation
                onProfileClick={() => { }}
                onLoginClick={() => { }}
                isLoggedIn={false} // Just for display
                showProfile={false} // Hide profile button here or redirect to main
            />
        </main>
    )
}
