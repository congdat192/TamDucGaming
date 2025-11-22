import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { DEFAULT_CONFIG, clearConfigCache } from '@/lib/gameConfig'
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
      return NextResponse.json({
        success: false,
        error: 'Lỗi lưu config: ' + error.message
      }, { status: 500 })
    }

    // Clear cache so new config takes effect immediately
    clearConfigCache()

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
