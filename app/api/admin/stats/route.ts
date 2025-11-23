import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Simple admin authentication
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

    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get total game sessions (from game_sessions)
    const { count: totalSessions } = await supabase
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })

    // Get total vouchers issued
    const { count: totalVouchers } = await supabase
      .from('vouchers')
      .select('*', { count: 'exact', head: true })

    // Get active users (played in last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: activePlayers } = await supabase
      .from('game_sessions')
      .select('user_id')
      .gte('played_at', sevenDaysAgo.toISOString())

    const activeUsers = new Set(activePlayers?.map(p => p.user_id) || []).size

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalSessions: totalSessions || 0,
      totalVouchers: totalVouchers || 0,
      activeUsers: activeUsers || 0
    })

  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
