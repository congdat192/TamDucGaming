'use client'

import { useEffect, useState } from 'react'
import { audioManager } from '@/lib/audio'

type BGMTrack = 'homepage' | 'gameplay' | 'leaderboard'

export function useBGM(track: BGMTrack) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [volume, setVolumeState] = useState(audioManager.getBGMVolume())
    const [isMuted, setIsMuted] = useState(audioManager.isBGMMuted())

    const trackPath = `/audio/bgm/${track}.mp3`

    useEffect(() => {
        // Auto-play BGM on mount (will be blocked by browser until user interaction)
        play()

        // Cleanup on unmount
        return () => {
            audioManager.stopBGM()
        }
    }, [track])

    const play = () => {
        audioManager.playBGM(trackPath, { loop: true })
        setIsPlaying(true)
    }

    const pause = () => {
        audioManager.pauseBGM()
        setIsPlaying(false)
    }

    const resume = () => {
        audioManager.resumeBGM()
        setIsPlaying(true)
    }

    const stop = () => {
        audioManager.stopBGM()
        setIsPlaying(false)
    }

    const setVolume = (vol: number) => {
        audioManager.setBGMVolume(vol)
        setVolumeState(vol)
    }

    const toggleMute = () => {
        audioManager.toggleBGMMute()
        setIsMuted(audioManager.isBGMMuted())
    }

    return {
        play,
        pause,
        resume,
        stop,
        setVolume,
        toggleMute,
        isPlaying,
        volume,
        isMuted
    }
}
