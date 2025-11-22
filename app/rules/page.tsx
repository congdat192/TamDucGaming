'use client'

import { useRouter } from 'next/navigation'
import Snowflakes from '@/components/Snowflakes'
import BottomNavigation from '@/components/BottomNavigation'
import { useState, useEffect } from 'react'
import ProfileModal from '@/components/ProfileModal'

export default function RulesPage() {
    const router = useRouter()
    const [showProfile, setShowProfile] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me')
            if (res.ok) {
                const data = await res.json()
                setIsLoggedIn(true)
                setUser(data.user)
            }
        } catch (error) {
            console.error('Auth check failed:', error)
        }
    }

    return (
        <main className="min-h-screen relative overflow-hidden pb-20 bg-[#0f172a]">
            <Snowflakes />

            {/* Header */}
            <header className="relative z-10 py-4 px-4 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-md sticky top-0">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <button
                        onClick={() => router.push('/')}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 backdrop-blur-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <h1 className="text-lg font-bold text-white">Thể Lệ Trò Chơi</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            {/* Content */}
            <div className="relative z-10 max-w-md mx-auto px-4 py-6 space-y-6">

                {/* How to Play */}
                <section className="glass rounded-2xl p-5">
                    <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                        <span>🎮</span> Cách Chơi
                    </h2>
                    <ul className="space-y-3 text-white/90 text-sm leading-relaxed">
                        <li className="flex gap-3">
                            <span className="bg-white/10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                            <span>Nhấn vào màn hình hoặc phím <strong>Space</strong> để giúp Ông Già Noel nhảy lên.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-white/10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                            <span>Khéo léo vượt qua các ống khói để ghi điểm. Mỗi ống khói vượt qua được tính <strong>1 điểm</strong>.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-white/10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                            <span>Trò chơi kết thúc nếu va chạm vào ống khói, chạm đất hoặc bay quá cao.</span>
                        </li>
                    </ul>
                </section>

                {/* Prizes */}
                <section className="glass rounded-2xl p-5">
                    <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                        <span>🎁</span> Giải Thưởng
                    </h2>
                    <div className="space-y-3 text-sm">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                            <div className="font-bold text-white mb-1">Top 1 - 3</div>
                            <div className="text-white/70">Voucher mua hàng trị giá lên đến <span className="text-yellow-400 font-bold">500.000đ</span></div>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                            <div className="font-bold text-white mb-1">Top 4 - 10</div>
                            <div className="text-white/70">Voucher mua hàng trị giá <span className="text-yellow-400 font-bold">100.000đ</span></div>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                            <div className="font-bold text-white mb-1">Quà tặng tham gia</div>
                            <div className="text-white/70">Voucher <strong>50.000đ</strong> cho tất cả người chơi đạt trên 10 điểm.</div>
                        </div>
                    </div>
                </section>

                {/* Terms */}
                <section className="glass rounded-2xl p-5">
                    <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                        <span>⚠️</span> Quy Định
                    </h2>
                    <ul className="space-y-2 text-white/80 text-xs list-disc pl-4 leading-relaxed">
                        <li>Mỗi số điện thoại chỉ được nhận giải thưởng một lần duy nhất trong suốt chiến dịch.</li>
                        <li>Nghiêm cấm mọi hành vi gian lận, hack điểm. Ban tổ chức sẽ hủy kết quả nếu phát hiện vi phạm.</li>
                        <li>Quyết định của Mắt Kính Tâm Đức là quyết định cuối cùng.</li>
                    </ul>
                </section>

                {/* Contact */}
                <div className="text-center text-white/40 text-xs pt-4">
                    <p>Mọi thắc mắc vui lòng liên hệ</p>
                    <p className="font-bold text-white/60 mt-1">Hotline: 1900 xxxx</p>
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
                    setIsLoggedIn(false)
                    setUser(null)
                }}
            />

            <BottomNavigation
                onProfileClick={() => setShowProfile(true)}
                onLoginClick={() => router.push('/')}
                isLoggedIn={isLoggedIn}
                showProfile={true}
            />
        </main>
    )
}
