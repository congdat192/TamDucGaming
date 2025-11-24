'use client'

import { useState, useEffect } from 'react'
import { audioManager } from '@/lib/audio'

export default function FloatingAudioToggle() {
    const [isMuted, setIsMuted] = useState(false)

    useEffect(() => {
        // Initialize state
        setIsMuted(audioManager.isMasterMuted())

        // Listen for changes from other components
        const handleAudioChange = () => {
            setIsMuted(audioManager.isMasterMuted())
        }

        audioManager.addListener(handleAudioChange)

        return () => {
            audioManager.removeListener(handleAudioChange)
        }
    }, [])

    const toggleAudio = () => {
        const newMutedState = !isMuted
        audioManager.setMasterMute(newMutedState)
        setIsMuted(newMutedState)
    }

    return (
        <button
            onClick={toggleAudio}
            className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-lg active:scale-95"
            aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
            <span className="text-2xl">{isMuted ? '🔇' : '🔊'}</span>
        </button>
    )
}
