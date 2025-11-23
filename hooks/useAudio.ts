'use client'

import { useEffect, useRef, useState } from 'react'

export interface UseAudioOptions {
    loop?: boolean
    volume?: number
    autoplay?: boolean
    onEnded?: () => void
}

export function useAudio(src: string, options: UseAudioOptions = {}) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [volume, setVolumeState] = useState(options.volume ?? 0.7)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)

    useEffect(() => {
        // Create audio element
        audioRef.current = new Audio(src)
        audioRef.current.loop = options.loop ?? false
        audioRef.current.volume = volume

        // Event listeners
        const audio = audioRef.current

        const handleEnded = () => {
            setIsPlaying(false)
            options.onEnded?.()
        }

        const handleLoadedMetadata = () => {
            setDuration(audio.duration)
        }

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime)
        }

        audio.addEventListener('ended', handleEnded)
        audio.addEventListener('loadedmetadata', handleLoadedMetadata)
        audio.addEventListener('timeupdate', handleTimeUpdate)

        // Autoplay if specified
        if (options.autoplay) {
            audio.play().catch(console.error)
            setIsPlaying(true)
        }

        // Cleanup
        return () => {
            audio.removeEventListener('ended', handleEnded)
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
            audio.removeEventListener('timeupdate', handleTimeUpdate)
            audio.pause()
            audio.src = ''
        }
    }, [src])

    const play = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(console.error)
            setIsPlaying(true)
        }
    }

    const pause = () => {
        if (audioRef.current) {
            audioRef.current.pause()
            setIsPlaying(false)
        }
    }

    const stop = () => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
            setIsPlaying(false)
        }
    }

    const setVolume = (vol: number) => {
        const newVolume = Math.max(0, Math.min(1, vol))
        setVolumeState(newVolume)
        if (audioRef.current) {
            audioRef.current.volume = newVolume
        }
    }

    const seek = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time
            setCurrentTime(time)
        }
    }

    return {
        play,
        pause,
        stop,
        setVolume,
        seek,
        isPlaying,
        volume,
        duration,
        currentTime
    }
}
