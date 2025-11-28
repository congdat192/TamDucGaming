import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const email = 'testhack3@matkinhtamduc.com'

    try {
        // 1. Get user data
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found', details: userError }, { status: 404 })
        }

        // 2. Get all game sessions
        const { data: sessions, error: sessionsError } = await supabaseAdmin
            .from('game_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('start_time', { ascending: false })

        // 3. Get game config
        const { data: config } = await supabaseAdmin
            .from('game_config')
            .select('*')
            .single()

        // 4. Calculate stats
        const maxPlays = config?.max_plays_per_day || 3
        const expectedRemaining = Math.max(0, maxPlays - user.plays_today) + user.bonus_plays
        const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0
        const startedSessions = sessions?.filter(s => s.status === 'started').length || 0
        const invalidSessions = sessions?.filter(s => s.status === 'invalid').length || 0

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                plays_today: user.plays_today,
                bonus_plays: user.bonus_plays,
                last_play_date: user.last_play_date,
                created_at: user.created_at
            },
            sessions: sessions?.map(s => ({
                id: s.id,
                status: s.status,
                score: s.score,
                start_time: s.start_time,
                end_time: s.end_time,
                game_token: s.game_token?.substring(0, 8) + '...',
                suspicion_reason: s.suspicion_reason
            })),
            analysis: {
                maxPlaysPerDay: maxPlays,
                expectedRemainingPlays: expectedRemaining,
                totalSessions: sessions?.length || 0,
                completedSessions,
                startedSessions,
                invalidSessions,
                mismatch: completedSessions !== user.plays_today,
                issue: completedSessions !== user.plays_today
                    ? `⚠️ plays_today (${user.plays_today}) != completed sessions (${completedSessions})`
                    : '✅ No mismatch'
            }
        })
    } catch (error) {
        console.error('Investigation error:', error)
        return NextResponse.json({ error: 'Investigation failed', details: error }, { status: 500 })
    }
}
