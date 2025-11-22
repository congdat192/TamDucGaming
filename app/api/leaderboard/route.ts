import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { maskPhone } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all' // week, month, campaign, all
    const campaignId = searchParams.get('campaignId')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('game_sessions')
      .select(`
        user_id,
        users!inner (
          phone,
          referral_code
        )
      `)

    // Filter by time period
    const now = new Date()

    if (period === 'week') {
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      query = query.gte('played_at', startOfWeek.toISOString())
    } else if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      query = query.gte('played_at', startOfMonth.toISOString())
    } else if (period === 'campaign' && campaignId) {
      query = query.eq('campaign_id', campaignId)
    }

    // Get all sessions with user info
    const { data: sessions, error } = await query

    if (error) {
      console.error('Leaderboard query error:', error)
      return NextResponse.json(
        { error: 'Không thể tải bảng xếp hạng' },
        { status: 500 }
      )
    }

    // Aggregate scores by user
    const userScores: Record<string, { phone: string; totalScore: number; gamesPlayed: number }> = {}

    for (const session of sessions || []) {
      const userId = session.user_id
      const userData = session.users as any

      if (!userScores[userId]) {
        userScores[userId] = {
          phone: userData.phone,
          totalScore: 0,
          gamesPlayed: 0
        }
      }
    }

    // Now get actual scores
    const { data: scoreData, error: scoreError } = await supabase
      .from('game_sessions')
      .select('user_id, score')
      .in('user_id', Object.keys(userScores))

    if (!scoreError && scoreData) {
      for (const session of scoreData) {
        if (userScores[session.user_id]) {
          userScores[session.user_id].totalScore += session.score
          userScores[session.user_id].gamesPlayed += 1
        }
      }
    }

    // Convert to array and sort
    const leaderboard = Object.entries(userScores)
      .map(([userId, data]) => ({
        rank: 0,
        phone: maskPhone(data.phone),
        totalScore: data.totalScore,
        gamesPlayed: data.gamesPlayed
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }))

    // Get active campaigns
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, name, start_date, end_date')
      .eq('is_active', true)
      .order('start_date', { ascending: false })

    return NextResponse.json({
      leaderboard,
      period,
      campaigns: campaigns || []
    })

  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
