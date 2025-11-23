'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getGameConfig, type GameConfig } from '@/lib/gameConfig'

interface OutOfPlaysModalProps {
    isOpen: boolean
    onClose: () => void
    referralCode?: string
}

export default function OutOfPlaysModal({ isOpen, onClose, referralCode }: OutOfPlaysModalProps) {
    const router = useRouter()
    const [config, setConfig] = useState<GameConfig | null>(null)

    useEffect(() => {
        const loadConfig = async () => {
            const gameConfig = await getGameConfig()
            setConfig(gameConfig)
        }
        loadConfig()
    }, [])

    if (!isOpen || !config) return null

    const modalContent = config.modalContent.outOfPlaysModal

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass rounded-3xl p-6 max-w-sm w-full border border-white/10 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 p-8 bg-red-500/20 blur-3xl rounded-full -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 p-8 bg-green-500/20 blur-3xl rounded-full -ml-10 -mb-10"></div>

                <div className="relative z-10 text-center">
                    <div className="text-6xl mb-4 animate-bounce">{modalContent.icon}</div>

                    <h2 className="text-2xl font-bold text-white mb-2">
                        {modalContent.title}
                    </h2>

                    <p className="text-white/80 mb-6 text-sm leading-relaxed">
                        {modalContent.subtitle}
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/referral')}
                            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold text-lg rounded-2xl hover:from-yellow-300 hover:to-yellow-400 transition-all transform active:scale-95 shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-2 group"
                        >
                            <span className="group-hover:rotate-12 transition-transform">🎁</span>
                            {modalContent.buttonText}
                        </button>

                        <button
                            onClick={() => router.push('/')}
                            className="w-full py-3 bg-white/10 text-white font-medium text-sm rounded-xl hover:bg-white/20 transition border border-white/20"
                        >
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
