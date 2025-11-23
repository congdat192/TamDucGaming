'use client'

import { audioManager } from '@/lib/audio'
import { useState, useEffect } from 'react'

export function useSFX() {
    const [volume, setVolumeState] = useState(audioManager.getSFXVolume())
    const [isMuted, setIsMuted] = useState(audioManager.isSFXMuted())

    useEffect(() => {
        // Preload all SFX assets
        audioManager.preloadSFX([
            '/audio/sfx/jump.mp3',
            '/audio/sfx/collect-gift.mp3',
            '/audio/sfx/collect-glasses.mp3',
            '/audio/sfx/collect-star.mp3',
            '/audio/sfx/hit-bomb.mp3',
            '/audio/sfx/game-over.mp3',
            '/audio/sfx/button-click.mp3',
            '/audio/sfx/modal-open.mp3',
            '/audio/sfx/achievement.mp3'
        ])
    }, [])

    const playJump = () => {
        audioManager.playSFX('/audio/sfx/jump.mp3')
    }

    const playCollectGift = () => {
        audioManager.playSFX('/audio/sfx/collect-gift.mp3')
    }

    const playCollectGlasses = () => {
        audioManager.playSFX('/audio/sfx/collect-glasses.mp3')
    }

    const playCollectStar = () => {
        audioManager.playSFX('/audio/sfx/collect-star.mp3')
    }

    const playHitBomb = () => {
        audioManager.playSFX('/audio/sfx/hit-bomb.mp3')
    }

    const playGameOver = () => {
        audioManager.playSFX('/audio/sfx/game-over.mp3')
    }

    const playButtonClick = () => {
        audioManager.playSFX('/audio/sfx/button-click.mp3', { volume: 0.5 })
    }

    const playModalOpen = () => {
        audioManager.playSFX('/audio/sfx/modal-open.mp3', { volume: 0.4 })
    }

    const playAchievement = () => {
        audioManager.playSFX('/audio/sfx/achievement.mp3')
    }

    const setVolume = (vol: number) => {
        audioManager.setSFXVolume(vol)
        setVolumeState(vol)
    }

    const toggleMute = () => {
        audioManager.toggleSFXMute()
        setIsMuted(audioManager.isSFXMuted())
    }

    return {
        playJump,
        playCollectGift,
        playCollectGlasses,
        playCollectStar,
        playHitBomb,
        playGameOver,
        playButtonClick,
        playModalOpen,
        playAchievement,
        setVolume,
        toggleMute,
        volume,
        isMuted
    }
}
