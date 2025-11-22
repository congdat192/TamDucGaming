import { supabase } from './supabase'

export interface VoucherTier {
  minScore: number
  value: number
  label: string
}

export interface GameConfig {
  maxPlaysPerDay: number
  bonusPlaysForPhone: number
  bonusPlaysForReferral: number
  voucherTiers: VoucherTier[]
  testEmails: string[]
  testPhones: string[]
}

// Default config values
export const DEFAULT_CONFIG: GameConfig = {
  maxPlaysPerDay: 1,
  bonusPlaysForPhone: 3,
  bonusPlaysForReferral: 1,
  voucherTiers: [
    { minScore: 30, value: 150000, label: '150K' },
    { minScore: 20, value: 100000, label: '100K' },
    { minScore: 10, value: 50000, label: '50K' },
  ],
  testEmails: ['test@test.com', 'admin@matkinhtamduc.com', 'congdat192@gmail.com'],
  testPhones: ['0909999999', '0123456789'],
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
    cachedConfig = { ...DEFAULT_CONFIG, ...data.config_data }
    cacheTimestamp = now

    return cachedConfig
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

// Get voucher by score
export function getVoucherByScore(config: GameConfig, score: number): VoucherTier | null {
  // Sort tiers by minScore descending to get highest applicable tier
  const sortedTiers = [...config.voucherTiers].sort((a, b) => b.minScore - a.minScore)

  for (const tier of sortedTiers) {
    if (score >= tier.minScore) {
      return tier
    }
  }
  return null
}

// Clear cache (call after config update)
export function clearConfigCache(): void {
  cachedConfig = null
  cacheTimestamp = 0
}
