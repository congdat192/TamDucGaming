import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

interface GameSession {
    id: string
    validated_score: number
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
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload = verifyToken(token)
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const userId = payload.userId

        // Get user data
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('total_plays, plays_today, total_score, bonus_plays')
            .eq('id', userId)
            .single()

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get game config
        const { data: config } = await supabaseAdmin
            .from('game_config')
            .select('config_data')
            .eq('id', 'main')
            .single()

        const maxPlaysPerDay = config?.config_data?.maxPlaysPerDay || 3

        // Calculate plays remaining
        const totalMaxPlays = maxPlaysPerDay + (user.bonus_plays || 0)
        const playsRemaining = Math.max(0, totalMaxPlays - user.plays_today)

        // Get highest score from game_sessions
        const { data: highestSession } = await supabaseAdmin
            .from('game_sessions')
            .select('validated_score')
            .eq('user_id', userId)
            .order('validated_score', { ascending: false })
            .limit(1)
            .single()

        const highestScore = highestSession?.validated_score || user.total_score || 0

        return NextResponse.json({
            playsRemaining,
            maxPlays: totalMaxPlays,
            highestScore,
            totalPlays: user.total_plays || 0,
            totalScore: user.total_score || 0
        })
    } catch (error) {
        console.error('Stats API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
