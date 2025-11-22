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

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get stats
    const [usersResult, gamesResult, vouchersResult, referralsResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('game_sessions').select('id', { count: 'exact', head: true }),
      supabase.from('vouchers').select('id', { count: 'exact', head: true }),
      supabase.from('referrals').select('id', { count: 'exact', head: true })
    ])

    return NextResponse.json({
      totalUsers: usersResult.count || 0,
      totalGames: gamesResult.count || 0,
      totalVouchers: vouchersResult.count || 0,
      totalReferrals: referralsResult.count || 0
    })

  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
