import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { DEFAULT_CONFIG, clearConfigCache } from '@/lib/gameConfig'
import jwt from 'jsonwebtoken'

import { getGameConfig } from '@/lib/gameConfig'

// Simple admin authentication - check if token exists and starts with 'admin-token'
function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false

  const token = authHeader.replace('Bearer ', '')
  return token.startsWith('admin-token')
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get config from database
    const config = await getGameConfig()

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Get config error:', error)
    return NextResponse.json(
      { error: 'Failed to get config' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { config } = await request.json()

    if (!config) {
      return NextResponse.json(
        { error: 'Config is required' },
        { status: 400 }
      )
    }

    // Upsert config in database
    const { error } = await supabase
      .from('game_config')
      .upsert({
        id: 'main',
        config_data: config,
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
