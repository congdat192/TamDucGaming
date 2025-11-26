import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface GameSession {
  id: string
  score: number
  played_at: string
  campaign_id: string | null
  campaigns?: {
    name: string
  } | null
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập' },
        { status: 401 }
      )
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Token không hợp lệ' },
        { status: 401 }
      )
    }

    // Get user's game sessions with campaign info
    const { data: sessions, error } = await supabaseAdmin
      .from('game_sessions')
      .select(`
        id,
        score,
        played_at,
        campaign_id,
        campaigns (
          name
        )
      `)
      .eq('user_id', payload.userId)
      .order('played_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Get play history error:', error)
      return NextResponse.json(
        { error: 'Không thể lấy lịch sử chơi' },
        { status: 500 }
      )
    }

    // Calculate stats
    const totalGames = sessions?.length || 0
    const totalScore = sessions?.reduce((sum, s) => sum + s.score, 0) || 0
    const highestScore = sessions?.length ? Math.max(...sessions.map(s => s.score)) : 0
    const averageScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0

    // Format sessions
    const formattedSessions = ((sessions || []) as unknown as GameSession[]).map(s => ({
      id: s.id,
      score: s.score,
      playedAt: s.played_at,
      campaignName: s.campaigns?.name || null
    }))

    return NextResponse.json({
      sessions: formattedSessions,
      stats: {
        totalGames,
        totalScore,
        highestScore,
        averageScore
      }
    })
  } catch (error) {
    console.error('Play history error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
