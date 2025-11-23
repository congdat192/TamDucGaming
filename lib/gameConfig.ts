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
  modalContent: {
    addPhoneModal: {
      title: string
      subtitle: string
      buttonText: string
      icon: string
      badge: string
    }
    outOfPlaysModal: {
      title: string
      subtitle: string
      buttonText: string
      icon: string
    }
    gameOverModal: {
      title: string
      playAgainButton: string
      shareButton: string
      homeButton: string
      inviteButton: string
      voucherSectionTitle: string
      progressLabels: {
        label50k: string
        label100k: string
        label150k: string
      }
    }
  }
  emailTemplates: {
    referralBonus: {
      subject: string
      fromName: string
      fromEmail: string
      htmlTemplate: string
    }
    otpLogin: {
      subject: string
      fromName: string
      fromEmail: string
      htmlTemplate: string
    }
    referralCompletion: {
      subject: string
      fromName: string
      fromEmail: string
      htmlTemplate: string
    }
  }
}

// Default config values
export const DEFAULT_CONFIG: GameConfig = {
  maxPlaysPerDay: 1,
  bonusPlaysForPhone: 3,
  bonusPlaysForReferral: 5,
  voucherTiers: [
    { minScore: 30, value: 150000, label: '150K' },
    { minScore: 20, value: 100000, label: '100K' },
    { minScore: 10, value: 50000, label: '50K' },
  ],
  testEmails: ['test@test.com', 'admin@matkinhtamduc.com', 'congdat192@gmail.com'],
  testPhones: ['0909999999', '0123456789'],
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
  modalContent: {
    addPhoneModal: {
      title: 'Nhận thêm 3 lượt chơi',
      subtitle: 'Cập nhật số điện thoại của bạn để nhận thêm lượt chơi',
      buttonText: '🎁 CẬP NHẬT SỐ ĐIỆN THOẠI',
      icon: '🎮',
      badge: '+ 3 lượt chơi',
    },
    outOfPlaysModal: {
      title: 'Hết lượt chơi rồi!',
      subtitle: 'Đừng buồn, mời bạn bè chơi cùng để nhận ngay +5 lượt chơi miễn phí nhé!',
      buttonText: 'Mời bạn bè (+5 lượt)',
      icon: '😢',
    },
    gameOverModal: {
      title: 'GAME OVER',
      playAgainButton: 'CHƠI LẠI',
      shareButton: 'CHIA SẺ NHẬN +5 LƯỢT',
      homeButton: 'Về trang chủ',
      inviteButton: 'Mời bạn bè (+5 lượt)',
      voucherSectionTitle: 'Chúc mừng! Bạn đã nhận được voucher',
      progressLabels: {
        label50k: '50K',
        label100k: '100K',
        label150k: '150K',
      },
    },
  },
  emailTemplates: {
    referralBonus: {
      subject: '🎁 Bạn nhận được +{{bonusPlays}} lượt chơi từ Santa Jump!',
      fromName: 'Santa Jump',
      fromEmail: 'onboarding@resend.dev',
      htmlTemplate: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="font-size: 48px; margin-bottom: 16px;">🎁</div>
    <h1 style="color: #111827; margin: 0 0 8px; font-size: 24px;">Chúc mừng!</h1>
    <p style="color: #4b5563; margin: 0; font-size: 16px;">
      Bạn nhận được <strong>+{{bonusPlays}} lượt chơi</strong> khi mời thành công <strong style="color: #059669;">{{refereeEmail}}</strong>
    </p>
  </div>
  <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px; border: 1px solid #e5e7eb;">
    <p style="color: #6b7280; margin: 0 0 8px; font-size: 14px;">Tổng cộng bạn nhận được</p>
    <div style="color: #059669; font-size: 32px; font-weight: bold;">+{{bonusPlays}} lượt chơi</div>
  </div>
  <div style="text-align: center;">
    <a href="{{appUrl}}" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 16px;">
      Vào chơi ngay 🎮
    </a>
  </div>
  <div style="text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px;">
    <p>Mắt Kính Tâm Đức - Santa Jump Game</p>
  </div>
</div>`,
    },
    otpLogin: {
      subject: '🎅 Mã OTP đăng nhập Santa Jump',
      fromName: 'Santa Jump',
      fromEmail: 'gaming@matkinhtamduc.com',
      htmlTemplate: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 30px; border-radius: 15px; text-align: center;">
    <h1 style="color: #FFD700; margin: 0; font-size: 28px;">🎅 SANTA JUMP 🎄</h1>
    <p style="color: #22c55e; margin: 10px 0; font-size: 18px;">Mắt Kính Tâm Đức</p>
  </div>
  <div style="background: #f0f9ff; padding: 30px; border-radius: 15px; margin-top: 20px; text-align: center;">
    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Mã OTP của bạn là:</p>
    <div style="background: #1e3a5f; color: #FFD700; font-size: 36px; font-weight: bold; padding: 20px 40px; border-radius: 10px; letter-spacing: 8px; display: inline-block;">
      {{otp}}
    </div>
    <p style="color: #666; font-size: 14px; margin-top: 20px;">Mã có hiệu lực trong 5 phút</p>
  </div>
  <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
    By Chief Everything Officer
  </p>
</div>`,
    },
    referralCompletion: {
      subject: '🎁 Bạn nhận được lượt chơi mới!',
      fromName: 'Santa Jump',
      fromEmail: 'gaming@matkinhtamduc.com',
      htmlTemplate: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 30px; border-radius: 15px; text-align: center;">
    <h1 style="color: #FFD700; margin: 0; font-size: 28px;">🎅 SANTA JUMP 🎄</h1>
    <p style="color: #22c55e; margin: 10px 0; font-size: 18px;">Mắt Kính Tâm Đức</p>
  </div>
  <div style="background: #f0f9ff; padding: 30px; border-radius: 15px; margin-top: 20px; text-align: center;">
    <h2 style="color: #1e3a5f; margin-top: 0;">Chúc mừng! 🎉</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.5;">
      Bạn bè của bạn đã tham gia trò chơi và hoàn thành lượt chơi đầu tiên.
    </p>
    <div style="background: #22c55e; color: white; font-size: 24px; font-weight: bold; padding: 15px 30px; border-radius: 10px; display: inline-block; margin: 20px 0;">
      +{{bonusPlays}} Lượt Chơi
    </div>
    <p style="color: #666; font-size: 14px;">
      Hãy vào game ngay để sử dụng lượt chơi mới nhé!
    </p>
    <a href="{{appUrl}}" style="display: inline-block; background: #FFD700; color: #000; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 25px; margin-top: 10px;">Chơi Ngay</a>
  </div>
  <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
    By Chief Everything Officer
  </p>
</div>`,
    },
  },
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
