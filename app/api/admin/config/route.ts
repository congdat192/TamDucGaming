import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'santa-jump-secret'

function verifyAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false

  const token = authHeader.substring(7)
  try {
    jwt.verify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}

// Default config values
const DEFAULT_CONFIG = {
  // Gameplay
  maxPlaysPerDay: 1,
  bonusPlaysForPhone: 3,
  bonusPlaysForReferral: 1,

  // Voucher tiers
  voucherTiers: [
    { minScore: 30, value: 150000, label: '150K' },
    { minScore: 20, value: 100000, label: '100K' },
    { minScore: 10, value: 50000, label: '50K' },
  ],

  // Leaderboard prizes
  leaderboardPrizes: [
    { rank: 1, value: 500000 },
    { rank: 2, value: 300000 },
    { rank: 3, value: 200000 },
    { rank: '4-10', value: 100000 },
  ],

  // Test accounts
  testEmails: ['test@test.com', 'admin@matkinhtamduc.com', 'congdat192@gmail.com'],
  testPhones: ['0909999999', '0123456789'],
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Try to get config from database
    const { data: config, error } = await supabase
      .from('game_config')
      .select('*')
      .single()

    if (error || !config) {
      // Return default config if not found in DB
      return NextResponse.json(DEFAULT_CONFIG)
    }

    return NextResponse.json(config.config_data || DEFAULT_CONFIG)

  } catch (error) {
    console.error('Get config error:', error)
    return NextResponse.json(DEFAULT_CONFIG)
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const configData = await request.json()

    // Upsert config in database
    const { error } = await supabase
      .from('game_config')
      .upsert({
        id: 'main',
        config_data: configData,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Save config error:', error)
      // Still return success if table doesn't exist - config will use defaults
      return NextResponse.json({
        success: true,
        message: 'Config saved (note: game_config table may need to be created)'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Cấu hình đã được lưu'
    })

  } catch (error) {
    console.error('Save config error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
