import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        // Get all started sessions older than 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

        const { data: staleSessions, error } = await supabaseAdmin
            .from('game_sessions')
            .select('*')
            .eq('status', 'started')
            .lt('start_time', fiveMinutesAgo)
            .order('start_time', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            count: staleSessions?.length || 0,
            sessions: staleSessions?.map(s => ({
                id: s.id,
                user_id: s.user_id,
                start_time: s.start_time,
                age_minutes: Math.floor((Date.now() - new Date(s.start_time).getTime()) / 60000)
            }))
        })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        // Cleanup all stale sessions
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

        const { data: staleSessions } = await supabaseAdmin
            .from('game_sessions')
            .select('id')
            .eq('status', 'started')
            .lt('start_time', fiveMinutesAgo)

        if (!staleSessions || staleSessions.length === 0) {
            return NextResponse.json({ message: 'No stale sessions to clean up', count: 0 })
        }

        const { error } = await supabaseAdmin
            .from('game_sessions')
            .update({
                status: 'invalid',
                suspicion_reason: 'Auto-cleanup: Session timeout >5 minutes'
            })
            .in('id', staleSessions.map(s => s.id))

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            message: 'Cleanup successful',
            count: staleSessions.length
        })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
