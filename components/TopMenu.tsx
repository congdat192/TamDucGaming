'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { audioManager } from '@/lib/audio'

interface TopMenuProps {
    isLoggedIn?: boolean
    onProfileClick?: () => void
    onLoginClick?: () => void
    onLogoutClick?: () => void
}

export default function TopMenu({
    isLoggedIn = false,
    onProfileClick,
    onLoginClick,
    onLogoutClick
}: TopMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const pathname = usePathname()
    const router = useRouter()

    // Initialize audio state
    useEffect(() => {
        setIsMuted(audioManager.isMasterMuted())
    }, [])

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    const toggleAudio = () => {
        const newMutedState = !isMuted
        audioManager.setMasterMute(newMutedState)
        setIsMuted(newMutedState)
    }

    const handleProfileClick = () => {
        setIsOpen(false)
        if (isLoggedIn) {
            onProfileClick?.()
        } else {
            onLoginClick?.()
        }
    }

    const handleLogout = () => {
        setIsOpen(false)
        onLogoutClick?.()
    }

    return (
        <>
            {/* Hamburger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-lg active:scale-95"
                aria-label="Menu"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed top-0 left-0 bottom-0 w-64 bg-[#1a4d2e] border-r border-white/10 z-[70] transform transition-transform duration-300 ease-out shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <span className="text-xl font-bold text-white">Menu</span>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-white/70 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Links */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    <Link
                        href="/"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === '/'
                            ? 'bg-yellow-400/20 text-yellow-400 font-bold'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <span className="text-xl">🏠</span>
                        <span>Trang chủ</span>
                    </Link>

                    <button
                        onClick={handleProfileClick}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-white/80 hover:bg-white/10 hover:text-white text-left"
                    >
                        <span className="text-xl">👤</span>
                        <span>{isLoggedIn ? 'Thông tin tài khoản' : 'Đăng nhập'}</span>
                    </button>

                    <Link
                        href="/play-history"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === '/play-history'
                            ? 'bg-yellow-400/20 text-yellow-400 font-bold'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <span className="text-xl">📊</span>
                        <span>Lịch sử chơi</span>
                    </Link>

                    <Link
                        href="/leaderboard"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname.startsWith('/leaderboard')
                            ? 'bg-yellow-400/20 text-yellow-400 font-bold'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <span className="text-xl">🏆</span>
                        <span>Bảng xếp hạng</span>
                    </Link>

                    <Link
                        href="/referral"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === '/referral'
                            ? 'bg-yellow-400/20 text-yellow-400 font-bold'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <span className="text-xl">🎁</span>
                        <span>Giới thiệu bạn bè</span>
                    </Link>

                    <Link
                        href="/rules"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === '/rules'
                            ? 'bg-yellow-400/20 text-yellow-400 font-bold'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <span className="text-xl">📜</span>
                        <span>Thể lệ & Giải thưởng</span>
                    </Link>

                    {/* Audio Toggle */}
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5">
                        <div className="flex items-center gap-3 text-white/80">
                            <span className="text-xl">{isMuted ? '🔇' : '🔊'}</span>
                            <span>Âm thanh</span>
                        </div>

                        <button
                            onClick={toggleAudio}
                            className={`w-12 h-6 rounded-full transition-colors relative ${!isMuted ? 'bg-green-500' : 'bg-gray-600'
                                }`}
                        >
                            <div
                                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${!isMuted ? 'left-7' : 'left-1'
                                    }`}
                            />
                        </button>
                    </div>
                </nav>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/10 space-y-2">
                    {isLoggedIn && (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-red-400 hover:bg-red-400/10 hover:text-red-300 text-left"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                            </svg>
                            <span>Đăng xuất</span>
                        </button>
                    )}

                    <div className="text-center text-xs text-white/30 pt-2">
                        Version 1.0.0
                    </div>
                </div>
            </div>
        </>
    )
}
