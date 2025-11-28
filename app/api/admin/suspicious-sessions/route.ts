import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'santa-jump-secret'

async function verifyAdminToken(request: NextRequest): Promise<boolean> {
  // Try Authorization header first (for API calls with Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { role?: string; isAdmin?: boolean }
      return payload.role === 'admin' || payload.isAdmin === true
    } catch {
      // Continue to check cookie
    }
  }

  // Try cookie (for browser requests)
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-token')?.value
    if (!token) return false

    const payload = jwt.verify(token, JWT_SECRET) as { isAdmin?: boolean }
    return payload.isAdmin === true
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdminToken(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter') || 'suspicious'

  try {
    // Build query based on filter
    let query = supabaseAdmin
      .from('game_sessions')
      .select(`
        id,
        user_id,
        game_token,
        status,
        start_time,
        end_time,
        client_score,
        validated_score,
        client_duration_seconds,
        suspicion_reason,
        ip_hash,
        user_agent,
        users (
          phone,
          email,
          name
        )
      `)
      .order('start_time', { ascending: false })
      .limit(100)

    if (filter === 'suspicious') {
      query = query.not('suspicion_reason', 'is', null)
    } else if (filter === 'invalid') {
      query = query.eq('status', 'invalid')
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Error fetching sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    // Calculate stats
    const { data: suspiciousCount } = await supabaseAdmin
      .from('game_sessions')
      .select('id', { count: 'exact', head: true })
      .not('suspicion_reason', 'is', null)

    const { data: invalidCount } = await supabaseAdmin
      .from('game_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'invalid')

    // Calculate total score reduced
    const { data: reducedSessions } = await supabaseAdmin
      .from('game_sessions')
      .select('client_score, validated_score')
      .not('suspicion_reason', 'is', null)
      .not('client_score', 'is', null)
      .not('validated_score', 'is', null)

    const totalScoreReduced = (reducedSessions || []).reduce((sum, s) => {
      const diff = (s.client_score || 0) - (s.validated_score || 0)
      return sum + Math.max(0, diff)
    }, 0)

    // Transform data to include user info
    const transformedSessions = (sessions || []).map(s => ({
      ...s,
      user: Array.isArray(s.users) ? s.users[0] : s.users
    }))

    return NextResponse.json({
      sessions: transformedSessions,
      stats: {
        totalSuspicious: suspiciousCount || 0,
        totalBlocked: invalidCount || 0,
        totalScoreReduced
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
