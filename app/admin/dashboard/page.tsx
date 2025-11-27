'use client'

import { useEffect, useState } from 'react'

interface Stats {
    totalUsers: number
    totalSessions: number
    totalVouchers: number
    activeUsers: number
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('admin-token')
            const res = await fetch('/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="text-white">Đang tải...</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">📊 Dashboard</h1>
                <p className="text-gray-400">Tổng quan hệ thống Santa Jump</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 shadow-lg">
                    <div className="text-blue-100 text-sm mb-2">Tổng người dùng</div>
                    <div className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</div>
                </div>

                <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 shadow-lg">
                    <div className="text-green-100 text-sm mb-2">Lượt chơi</div>
                    <div className="text-3xl font-bold text-white">{stats?.totalSessions || 0}</div>
                </div>

                <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-6 shadow-lg">
                    <div className="text-yellow-100 text-sm mb-2">Voucher đã phát</div>
                    <div className="text-3xl font-bold text-white">{stats?.totalVouchers || 0}</div>
                </div>

                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 shadow-lg">
                    <div className="text-purple-100 text-sm mb-2">Người dùng hoạt động</div>
                    <div className="text-3xl font-bold text-white">{stats?.activeUsers || 0}</div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-bold text-white mb-4">⚡ Truy cập nhanh</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <a href="/admin/config" className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition text-center">
                        <div className="text-2xl mb-2">⚙️</div>
                        <div className="text-white text-sm">Cấu hình</div>
                    </a>
                    <a href="/admin/email-templates" className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition text-center">
                        <div className="text-2xl mb-2">📧</div>
                        <div className="text-white text-sm">Email</div>
                    </a>
                    <a href="/admin/modal-content" className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition text-center">
                        <div className="text-2xl mb-2">💬</div>
                        <div className="text-white text-sm">Modal</div>
                    </a>
                    <a href="/admin/campaigns" className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition text-center">
                        <div className="text-2xl mb-2">📅</div>
                        <div className="text-white text-sm">Chiến dịch</div>
                    </a>
                    <a href="/admin/suspicious" className="p-4 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition text-center border border-red-500/30">
                        <div className="text-2xl mb-2">🚨</div>
                        <div className="text-white text-sm">Nghi vấn</div>
                    </a>
                </div>
            </div>
        </div>
    )
}
