import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { maskPhone } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all' // week, month, campaign, all
    const campaignId = searchParams.get('campaignId')
    const limit = parseInt(searchParams.get('limit') || '50')

    let leaderboardData: any[] = []

    if (period === 'week') {
      const { data, error } = await supabase
        .from('leaderboard_weekly')
        .select('*')
        .limit(limit)

      if (!error && data) {
        leaderboardData = data.map((item: any) => ({
          userId: item.id,
          phone: item.phone,
          totalScore: item.weekly_score,
          gamesPlayed: item.games_played
        }))
      }
    } else if (period === 'month') {
      const { data, error } = await supabase
        .from('leaderboard_monthly')
        .select('*')
        .limit(limit)

      if (!error && data) {
        leaderboardData = data.map((item: any) => ({
          userId: item.id,
          phone: item.phone,
          totalScore: item.monthly_score,
          gamesPlayed: item.games_played
        }))
      }
    } else if (period === 'all') {
      const { data, error } = await supabase
        .from('leaderboard_all_time')
        .select('*')
        .limit(limit)

      if (!error && data) {
        leaderboardData = data.map((item: any) => ({
          userId: item.id,
          phone: item.phone,
          totalScore: item.total_score,
          gamesPlayed: item.games_played
        }))
      }
    } else if (period === 'campaign' && campaignId) {
      // For campaign, we don't have a view, so we query game_sessions directly
      // BUT we include 'score' in the first query to avoid N+1
      const { data: sessions, error } = await supabase
        .from('game_sessions')
        .select(`
          user_id,
          score,
          users!inner (
            phone,
            referral_code
          )
        `)
        .eq('campaign_id', campaignId)

      if (!error && sessions) {
        // Aggregate in memory (Single Pass)
        const userScores: Record<string, { phone: string; totalScore: number; gamesPlayed: number }> = {}

        for (const session of sessions) {
          const userId = session.user_id
          const userData = session.users as any

          if (!userScores[userId]) {
            userScores[userId] = {
              phone: userData.phone,
              totalScore: 0,
              gamesPlayed: 0
            }
          }
          userScores[userId].totalScore += session.score
          userScores[userId].gamesPlayed += 1
        }

        leaderboardData = Object.entries(userScores)
          .map(([userId, data]) => ({
            userId,
            phone: data.phone,
            totalScore: data.totalScore,
            gamesPlayed: data.gamesPlayed
          }))
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, limit)
      }
    }

    // Format response
    const leaderboard = leaderboardData.map((entry: any, index: number) => ({
      rank: index + 1,
      phone: maskPhone(entry.phone),
      totalScore: entry.totalScore,
      gamesPlayed: entry.gamesPlayed
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
