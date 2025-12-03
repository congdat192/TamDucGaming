'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/admin/verify')
                const data = await res.json()

                if (data.isAdmin) {
                    setIsLoggedIn(true)
                } else {
                    setIsLoggedIn(false)
                    // If not on login page, redirect to admin root for login
                    if (pathname !== '/admin') {
                        router.push('/admin')
                    }
                }
            } catch {
                setIsLoggedIn(false)
                if (pathname !== '/admin') {
                    router.push('/admin')
                }
            }
            setLoading(false)
        }
        checkAuth()
    }, [pathname, router])

    const handleLogout = async () => {
        try {
            await fetch('/api/admin/logout', { method: 'POST' })
        } catch (error) {
            console.error('Logout error:', error)
        }
        setIsLoggedIn(false)
        router.push('/admin')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        )
    }

    // If not logged in and not on admin root, show nothing (will redirect)
    if (!isLoggedIn && pathname !== '/admin') {
        return null
    }

    // If not logged in and on admin root, show login (handled by page.tsx)
    if (!isLoggedIn) {
        return <>{children}</>
    }

    // Logged in - show admin layout with navigation
    const navItems = [
        { href: '/admin/dashboard', label: '📊 Dashboard', icon: '📊' },
        { href: '/admin/config', label: '⚙️ Cấu hình Game', icon: '⚙️' },
        { href: '/admin/notifications', label: '🔔 Thông báo', icon: '🔔' },
        { href: '/admin/rewards', label: '🎁 Quà tặng', icon: '🎁' },
        { href: '/admin/modal-content', label: '💬 Nội dung Modal', icon: '💬' },
        { href: '/admin/email-templates', label: '📧 Email Templates', icon: '📧' },
        { href: '/admin/email-logs', label: '📬 Email Logs', icon: '📬' },
        { href: '/admin/campaigns', label: '📅 Chiến dịch', icon: '📅' },
        { href: '/admin/ads', label: '📢 Quảng cáo', icon: '📢' },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="flex">
                {/* Sidebar Navigation */}
                <aside className="w-64 min-h-screen bg-gray-800/50 border-r border-white/10 p-6">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">🎅 Admin Panel</h1>
                        <p className="text-gray-400 text-sm">Santa Jump Game</p>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                            return (
                                <button
                                    key={item.href}
                                    onClick={() => router.push(item.href)}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${isActive
                                        ? 'bg-blue-600 text-white font-semibold'
                                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    {item.label}
                                </button>
                            )
                        })}
                    </nav>

                    <div className="mt-8 pt-8 border-t border-white/10">
                        <button
                            onClick={handleLogout}
                            className="w-full px-4 py-3 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all"
                        >
                            🚪 Đăng xuất
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
