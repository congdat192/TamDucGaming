import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { clearConfigCache, getGameConfig } from '@/lib/gameConfig'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'santa-jump-secret'

// Verify admin token from HTTP-only cookie
async function verifyAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-token')?.value

    if (!token) return false

    const decoded = jwt.verify(token, JWT_SECRET) as { isAdmin?: boolean }
    return decoded.isAdmin === true
  } catch {
    return false
  }
}

export async function GET() {
  try {
    // Check authentication
    if (!await verifyAdmin()) {
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
    if (!await verifyAdmin()) {
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

    // Remove deprecated fields before saving (now stored in separate tables)
    const cleanConfig = { ...config }
    delete cleanConfig.voucherTiers
    delete cleanConfig.leaderboardPrizes
    delete cleanConfig.emailTemplates
    delete cleanConfig.modalContent

    // Upsert config in database
    const { error } = await supabaseAdmin
      .from('game_config')
      .upsert({
        id: 'main',
        config_data: cleanConfig,
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
