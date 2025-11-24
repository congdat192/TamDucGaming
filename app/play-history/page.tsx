'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Snowflakes from '@/components/Snowflakes'
import BottomNavigation from '@/components/BottomNavigation'
import ProfileModal from '@/components/ProfileModal'

interface GameSession {
    id: string
    score: number
    playedAt: string
    campaignName: string | null
}

interface Stats {
    totalGames: number
    totalScore: number
    highestScore: number
    averageScore: number
}

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

export default function PlayHistoryPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [sessions, setSessions] = useState<GameSession[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [showProfile, setShowProfile] = useState(false)
    const [user, setUser] = useState<User | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    useEffect(() => {
        checkAuth()
        fetchHistory()
    }, [])

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me')
            if (res.ok) {
                const data = await res.json()
                setIsLoggedIn(true)
                setUser(data.user)
            } else {
                router.push('/')
            }
        } catch (error) {
            console.error('Auth check failed:', error)
            router.push('/')
        }
    }

    const fetchHistory = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/play-history')
            if (res.ok) {
                const data = await res.json()
                setSessions(data.sessions || [])
                setStats(data.stats || null)
            }
        } catch (error) {
            console.error('Failed to fetch history:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getScoreColor = (score: number) => {
        if (score >= 100) return 'text-yellow-400'
        if (score >= 50) return 'text-green-400'
        if (score >= 20) return 'text-blue-400'
        return 'text-white/70'
    }

    const getScoreBg = (score: number, index: number) => {
        if (index === 0 && score === stats?.highestScore) {
            return 'bg-gradient-to-r from-yellow-500/30 to-yellow-600/30 border-yellow-400/30'
        }
        return 'bg-white/5 border-white/10'
    }

    // Pagination logic
    const totalPages = Math.ceil(sessions.length / itemsPerPage)
    const currentData = sessions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

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
                    <h1 className="text-xl font-bold text-white">📊 Lịch Sử Chơi</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center px-4 py-4">
                {/* Stats Card */}
                {stats && (
                    <div className="glass rounded-3xl p-4 max-w-md w-full mb-4">
                        <h2 className="text-lg font-bold text-white mb-3 text-center">
                            Thống kê
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-yellow-400">
                                    {stats.totalGames}
                                </div>
                                <div className="text-white/60 text-xs">Tổng lượt chơi</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-green-400">
                                    {stats.totalScore.toLocaleString()}
                                </div>
                                <div className="text-white/60 text-xs">Tổng điểm</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-blue-400">
                                    {stats.highestScore.toLocaleString()}
                                </div>
                                <div className="text-white/60 text-xs">Điểm cao nhất</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-purple-400">
                                    {stats.averageScore.toLocaleString()}
                                </div>
                                <div className="text-white/60 text-xs">Điểm trung bình</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* History Table */}
                <div className="glass rounded-3xl p-4 max-w-md w-full">
                    <h2 className="text-lg font-bold text-white mb-3 text-center">
                        Chi tiết lượt chơi
                    </h2>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="text-white text-sm">Đang tải...</div>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-2">🎮</div>
                            <div className="text-white/70 text-sm">Chưa có lượt chơi nào</div>
                            <button
                                onClick={() => router.push('/game')}
                                className="mt-4 px-6 py-2 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-all"
                            >
                                Chơi ngay
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-white/50 border-b border-white/10">
                                <div className="col-span-1">#</div>
                                <div className="col-span-6">Thời gian</div>
                                <div className="col-span-5 text-right">Điểm</div>
                            </div>

                            {/* Table Body */}
                            <div className="space-y-2 mt-2">
                                {currentData.map((session, index) => {
                                    const globalIndex = (currentPage - 1) * itemsPerPage + index
                                    return (
                                        <div
                                            key={session.id}
                                            className={`grid grid-cols-12 gap-2 px-3 py-3 rounded-xl border ${getScoreBg(session.score, globalIndex)}`}
                                        >
                                            <div className="col-span-1 text-white/50 text-sm flex items-center">
                                                {globalIndex + 1}
                                            </div>
                                            <div className="col-span-6">
                                                <div className="text-white text-sm">
                                                    {formatDate(session.playedAt)}
                                                </div>
                                                {session.campaignName && (
                                                    <div className="text-white/40 text-[10px] truncate">
                                                        {session.campaignName}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-span-5 text-right flex items-center justify-end">
                                                <span className={`font-bold text-lg ${getScoreColor(session.score)}`}>
                                                    {session.score.toLocaleString()}
                                                </span>
                                                {globalIndex === 0 && session.score === stats?.highestScore && (
                                                    <span className="ml-1">🏆</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-4 mt-4">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs disabled:opacity-30 hover:bg-white/20"
                                    >
                                        Trước
                                    </button>
                                    <span className="text-white/70 text-xs">
                                        Trang {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs disabled:opacity-30 hover:bg-white/20"
                                    >
                                        Sau
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Info */}
                    <div className="mt-4 text-center text-white/50 text-[10px]">
                        <p>Hiển thị tối đa 100 lượt chơi gần nhất</p>
                    </div>
                </div>
            </div>

            {/* Profile Modal */}
            <ProfileModal
                isOpen={showProfile}
                onClose={() => setShowProfile(false)}
                user={user}
                onUserUpdate={checkAuth}
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
