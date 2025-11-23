// Audio utility functions

export interface AudioOptions {
    loop?: boolean
    volume?: number
    autoplay?: boolean
    preload?: boolean
}

export class AudioManager {
    private static instance: AudioManager
    private bgmAudio: HTMLAudioElement | null = null
    private sfxPool: Map<string, HTMLAudioElement[]> = new Map()
    private bgmVolume: number = 0.7
    private sfxVolume: number = 0.7
    private bgmMuted: boolean = false
    private sfxMuted: boolean = false

    private constructor() {
        // Load settings from localStorage
        this.loadSettings()
    }

    static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager()
        }
        return AudioManager.instance
    }

    private loadSettings() {
        if (typeof window === 'undefined') return

        const settings = localStorage.getItem('audioSettings')
        if (settings) {
            const parsed = JSON.parse(settings)
            this.bgmVolume = parsed.bgmVolume ?? 0.7
            this.sfxVolume = parsed.sfxVolume ?? 0.7
            this.bgmMuted = parsed.bgmMuted ?? false
            this.sfxMuted = parsed.sfxMuted ?? false
        }
    }

    saveSettings() {
        if (typeof window === 'undefined') return

        localStorage.setItem('audioSettings', JSON.stringify({
            bgmVolume: this.bgmVolume,
            sfxVolume: this.sfxVolume,
            bgmMuted: this.bgmMuted,
            sfxMuted: this.sfxMuted
        }))
    }

    // BGM Methods
    playBGM(src: string, options: AudioOptions = {}) {
        if (this.bgmMuted) return

        // Stop current BGM if playing
        if (this.bgmAudio) {
            this.bgmAudio.pause()
            this.bgmAudio.currentTime = 0
        }

        this.bgmAudio = new Audio(src)
        this.bgmAudio.loop = options.loop ?? true
        this.bgmAudio.volume = (options.volume ?? this.bgmVolume) * (this.bgmMuted ? 0 : 1)

        // Handle autoplay restrictions
        const playPromise = this.bgmAudio.play()
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('BGM autoplay prevented:', error)
            })
        }
    }

    pauseBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause()
        }
    }

    resumeBGM() {
        if (this.bgmAudio && !this.bgmMuted) {
            this.bgmAudio.play().catch(console.error)
        }
    }

    stopBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause()
            this.bgmAudio.currentTime = 0
            this.bgmAudio = null
        }
    }

    setBGMVolume(volume: number) {
        this.bgmVolume = Math.max(0, Math.min(1, volume))
        if (this.bgmAudio) {
            this.bgmAudio.volume = this.bgmMuted ? 0 : this.bgmVolume
        }
        this.saveSettings()
    }

    toggleBGMMute() {
        this.bgmMuted = !this.bgmMuted
        if (this.bgmAudio) {
            this.bgmAudio.volume = this.bgmMuted ? 0 : this.bgmVolume
        }
        this.saveSettings()
    }

    // SFX Methods
    playSFX(src: string, options: AudioOptions = {}) {
        if (this.sfxMuted) return

        const audio = new Audio(src)
        audio.volume = (options.volume ?? this.sfxVolume) * (this.sfxMuted ? 0 : 1)

        const playPromise = audio.play()
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('SFX play prevented:', error)
            })
        }

        // Clean up after playing
        audio.addEventListener('ended', () => {
            audio.remove()
        })
    }

    setSFXVolume(volume: number) {
        this.sfxVolume = Math.max(0, Math.min(1, volume))
        this.saveSettings()
    }

    toggleSFXMute() {
        this.sfxMuted = !this.sfxMuted
        this.saveSettings()
    }

    // Getters
    getBGMVolume() { return this.bgmVolume }
    getSFXVolume() { return this.sfxVolume }
    isBGMMuted() { return this.bgmMuted }
    isSFXMuted() { return this.sfxMuted }
}

// Singleton instance
export const audioManager = AudioManager.getInstance()
