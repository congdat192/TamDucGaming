import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { maskPhone, maskEmail } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all' // week, month, campaign, all
    const campaignId = searchParams.get('campaignId')
    const limit = parseInt(searchParams.get('limit') || '50')

    let leaderboardData: any[] = []

    if (period === 'week') {
      // Calculate start of week (Monday)
      const now = new Date()
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
      const startOfWeek = new Date(now.setDate(diff))
      startOfWeek.setHours(0, 0, 0, 0)

      const { data: sessions, error } = await supabaseAdmin
        .from('game_sessions')
        .select(`
          user_id,
          score,
          users!inner (
            phone,
            email,
            referral_code
          )
        `)
        .gte('played_at', startOfWeek.toISOString())

      if (!error && sessions) {
        // Aggregate in memory
        const userScores: Record<string, { phone: string; email: string; totalScore: number; gamesPlayed: number }> = {}

        for (const session of sessions) {
          const userId = session.user_id
          const userData = session.users as any

          if (!userScores[userId]) {
            userScores[userId] = {
              phone: userData.phone,
              email: userData.email,
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
            email: data.email,
            totalScore: data.totalScore,
            gamesPlayed: data.gamesPlayed
          }))
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, limit)
      }

    } else if (period === 'month') {
      // Calculate start of month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const { data: sessions, error } = await supabaseAdmin
        .from('game_sessions')
        .select(`
          user_id,
          score,
          users!inner (
            phone,
            email,
            referral_code
          )
        `)
        .gte('played_at', startOfMonth.toISOString())

      if (!error && sessions) {
        // Aggregate in memory
        const userScores: Record<string, { phone: string; email: string; totalScore: number; gamesPlayed: number }> = {}

        for (const session of sessions) {
          const userId = session.user_id
          const userData = session.users as any

          if (!userScores[userId]) {
            userScores[userId] = {
              phone: userData.phone,
              email: userData.email,
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
            email: data.email,
            totalScore: data.totalScore,
            gamesPlayed: data.gamesPlayed
          }))
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, limit)
      }

    } else if (period === 'all') {
      // Direct query to users table for total_score
      // Also need games_played count from game_sessions

      // 1. Get top users by total_score
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id, phone, email, total_score')
        .gt('total_score', 0)
        .order('total_score', { ascending: false })
        .limit(limit)

      if (!error && users) {
        // 2. Get game counts for these users
        // Note: Doing this in a loop for top 50 is acceptable, or we can do one aggregate query
        // For simplicity and performance on small datasets, we can fetch all sessions counts or just assume 0 if not critical
        // Better approach: Get game counts for these specific user IDs

        const userIds = users.map(u => u.id)

        // We can't easily do a "count group by" for specific IDs in one simple Supabase query without RPC
        // So we will fetch sessions for these users to count them, or just fetch all sessions counts (might be heavy)
        // Alternative: Add 'games_played' column to users table (best for future), but for now we calculate.

        // Optimization: Fetch all sessions for these users only
        const { data: sessions } = await supabaseAdmin
          .from('game_sessions')
          .select('user_id')
          .in('user_id', userIds)

        const gameCounts: Record<string, number> = {}
        if (sessions) {
          sessions.forEach(s => {
            gameCounts[s.user_id] = (gameCounts[s.user_id] || 0) + 1
          })
        }

        leaderboardData = users.map((user: any) => ({
          userId: user.id,
          phone: user.phone,
          email: user.email,
          totalScore: user.total_score,
          gamesPlayed: gameCounts[user.id] || 0
        }))
      }

    } else if (period === 'campaign' && campaignId) {
      const { data: sessions, error } = await supabaseAdmin
        .from('game_sessions')
        .select(`
          user_id,
          score,
          users!inner (
            phone,
            email,
            referral_code
          )
        `)
        .eq('campaign_id', campaignId)

      if (!error && sessions) {
        const userScores: Record<string, { phone: string; email: string; totalScore: number; gamesPlayed: number }> = {}

        for (const session of sessions) {
          const userId = session.user_id
          const userData = session.users as any

          if (!userScores[userId]) {
            userScores[userId] = {
              phone: userData.phone,
              email: userData.email,
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
            email: data.email,
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
      phone: entry.phone ? maskPhone(entry.phone) : null,
      email: entry.email ? maskEmail(entry.email) : null,
      totalScore: entry.totalScore,
      gamesPlayed: entry.gamesPlayed
    }))

    // Get active campaigns
    const { data: campaigns } = await supabaseAdmin
      .from('campaigns')
      .select('id, name, start_date, end_date')
      .eq('is_active', true)
      .order('start_date', { ascending: false })

    return NextResponse.json({
      leaderboard,
      period,
      campaigns: campaigns || []
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })

  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
