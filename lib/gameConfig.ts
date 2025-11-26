import { supabase } from './supabase'

export interface GameConfig {
  maxPlaysPerDay: number
  bonusPlaysForPhone: number
  bonusPlaysForReferral: number
  testEmails: string[]
  testPhones: string[]
  gameMechanics: {
    gravity: number
    jumpForce: number
    maxFallSpeed: number
    obstacleWidth: number
    gapHeight: number
    obstacleSpeed: number
    spawnInterval: number
    speedIncrement: number
    speedIncrementInterval: number
    maxSpeed: number
    gapDecrease: number
    minGap: number
    spawnIntervalDecrease: number
    minSpawnInterval: number
  }
  audio: {
    bgmVolume: number
    sfxVolume: number
    bgmEnabled: boolean
    sfxEnabled: boolean
  }
}

// Default config values
export const DEFAULT_CONFIG: GameConfig = {
  maxPlaysPerDay: 1,
  bonusPlaysForPhone: 3,
  bonusPlaysForReferral: 5,
  testEmails: [],
  testPhones: [],
  gameMechanics: {
    gravity: 0.5,
    jumpForce: -10,
    maxFallSpeed: 12,
    obstacleWidth: 70,
    gapHeight: 220,
    obstacleSpeed: 2,
    spawnInterval: 2500,
    speedIncrement: 0.15,
    speedIncrementInterval: 5000,
    maxSpeed: 5,
    gapDecrease: 4,
    minGap: 160,
    spawnIntervalDecrease: 100,
    minSpawnInterval: 1200,
  },
  audio: {
    bgmVolume: 0.7,
    sfxVolume: 0.7,
    bgmEnabled: true,
    sfxEnabled: true
  }
}

// Cache config to avoid hitting DB on every request
let cachedConfig: GameConfig | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 60000 // 1 minute cache

export async function getGameConfig(): Promise<GameConfig> {
  const now = Date.now()

  // Return cached config if still valid
  if (cachedConfig && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedConfig
  }

  try {
    const { data, error } = await supabase
      .from('game_config')
      .select('config_data')
      .eq('id', 'main')
      .single()

    if (error || !data) {
      console.log('Using default config (DB error or not found)')
      return DEFAULT_CONFIG
    }

    // Merge with defaults to ensure all fields exist
    const newConfig: GameConfig = { ...DEFAULT_CONFIG, ...data.config_data }
    cachedConfig = newConfig
    cacheTimestamp = now

    return newConfig
  } catch (error) {
    console.error('Error fetching game config:', error)
    return DEFAULT_CONFIG
  }
}

// Check if user is a test account
export function isTestAccount(config: GameConfig, email: string | null, phone: string | null): boolean {
  if (email && config.testEmails.includes(email)) return true
  if (phone && config.testPhones.includes(phone)) return true
  return false
}

// Clear cache (call after config update)
export function clearConfigCache(): void {
  cachedConfig = null
  cacheTimestamp = 0
}
