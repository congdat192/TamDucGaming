'use client'

import { useState, useEffect } from 'react'
import { audioManager } from '@/lib/audio'

export default function AudioControls() {
    const [bgmMuted, setBgmMuted] = useState(false)
    const [sfxMuted, setSfxMuted] = useState(false)
    const [showControls, setShowControls] = useState(false)

    useEffect(() => {
        setBgmMuted(audioManager.isBGMMuted())
        setSfxMuted(audioManager.isSFXMuted())
    }, [])

    const toggleBGM = () => {
        audioManager.toggleBGMMute()
        setBgmMuted(audioManager.isBGMMuted())
    }

    const toggleSFX = () => {
        audioManager.toggleSFXMute()
        setSfxMuted(audioManager.isSFXMuted())
    }

    return (
        <div className="fixed top-4 right-4 z-50">
            {/* Main toggle button */}
            <button
                onClick={() => setShowControls(!showControls)}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-lg"
                aria-label="Audio controls"
            >
                {bgmMuted && sfxMuted ? '🔇' : '🔊'}
            </button>

            {/* Expanded controls */}
            {showControls && (
                <div className="absolute top-14 right-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-xl min-w-[200px]">
                    <div className="space-y-3">
                        {/* BGM Control */}
                        <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-medium">🎵 Nhạc nền</span>
                            <button
                                onClick={toggleBGM}
                                className={`w-12 h-6 rounded-full transition-all ${bgmMuted ? 'bg-gray-600' : 'bg-green-500'
                                    }`}
                            >
                                <div
                                    className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${bgmMuted ? 'translate-x-1' : 'translate-x-6'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* SFX Control */}
                        <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-medium">🔔 Hiệu ứng</span>
                            <button
                                onClick={toggleSFX}
                                className={`w-12 h-6 rounded-full transition-all ${sfxMuted ? 'bg-gray-600' : 'bg-green-500'
                                    }`}
                            >
                                <div
                                    className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${sfxMuted ? 'translate-x-1' : 'translate-x-6'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
