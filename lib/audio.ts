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
    private listeners: Set<() => void> = new Set()

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

        // Notify all listeners
        this.notifyListeners()
    }

    // Event system for state synchronization
    addListener(callback: () => void) {
        this.listeners.add(callback)
    }

    removeListener(callback: () => void) {
        this.listeners.delete(callback)
    }

    private notifyListeners() {
        this.listeners.forEach(callback => callback())
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
    // SFX Methods
    preloadSFX(srcs: string[]) {
        srcs.forEach(src => {
            if (!this.sfxPool.has(src)) {
                this.sfxPool.set(src, [])
            }

            // Create initial pool of 3 instances per sound
            for (let i = 0; i < 3; i++) {
                const audio = new Audio(src)
                audio.preload = 'auto'
                this.sfxPool.get(src)?.push(audio)
            }
        })
    }

    playSFX(src: string, options: AudioOptions = {}) {
        if (this.sfxMuted) return

        let pool = this.sfxPool.get(src)
        if (!pool) {
            pool = []
            this.sfxPool.set(src, pool)
        }

        // Find an available audio instance (not paused means it's playing)
        let audio = pool.find(a => a.paused)

        if (!audio) {
            // If pool is full (e.g. 5 instances), reuse the first one (cut off sound)
            if (pool.length >= 5) {
                audio = pool[0]
                audio.currentTime = 0
            } else {
                // Create new instance
                audio = new Audio(src)
                pool.push(audio)
            }
        }

        audio.volume = (options.volume ?? this.sfxVolume) * (this.sfxMuted ? 0 : 1)

        const playPromise = audio.play()
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Auto-play policy or other error
                // console.log('SFX play prevented:', error)
            })
        }
    }

    setSFXVolume(volume: number) {
        this.sfxVolume = Math.max(0, Math.min(1, volume))
        this.saveSettings()
    }

    toggleSFXMute() {
        this.sfxMuted = !this.sfxMuted
        this.saveSettings()
    }

    // Master Mute
    setMasterMute(muted: boolean) {
        this.bgmMuted = muted
        this.sfxMuted = muted

        if (this.bgmAudio) {
            this.bgmAudio.volume = this.bgmMuted ? 0 : this.bgmVolume
        }

        this.saveSettings()
    }

    isMasterMuted() {
        return this.bgmMuted && this.sfxMuted
    }

    // Getters
    getBGMVolume() { return this.bgmVolume }
    getSFXVolume() { return this.sfxVolume }
    isBGMMuted() { return this.bgmMuted }
    isSFXMuted() { return this.sfxMuted }
}

// Singleton instance
export const audioManager = AudioManager.getInstance()
