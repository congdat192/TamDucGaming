import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        // Get email from query parameter
        const { searchParams } = new URL(request.url)
        const email = searchParams.get('email')

        if (!email) {
            return NextResponse.json(
                { error: 'Email parameter required' },
                { status: 400 }
            )
        }

        // Get user by email
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Invalidate all orphaned sessions
        const { data: invalidatedSessions, error: invalidateError } = await supabaseAdmin
            .from('game_sessions')
            .update({
                status: 'invalid',
                suspicion_reason: 'Orphaned session - bug fix cleanup'
            })
            .eq('user_id', user.id)
            .eq('status', 'started')
            .select()

        // Reset plays_today
        const { error: resetError } = await supabaseAdmin
            .from('users')
            .update({ plays_today: 0 })
            .eq('id', user.id)

        if (invalidateError || resetError) {
            return NextResponse.json({
                error: 'Cleanup failed',
                invalidateError,
                resetError
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: `Cleaned up user ${email}`,
            invalidatedSessions: invalidatedSessions?.length || 0,
            user: {
                id: user.id,
                email: user.email,
                plays_today: 0
            }
        })
    } catch (error) {
        console.error('Cleanup error:', error)
        return NextResponse.json({ error: 'Cleanup failed', details: error }, { status: 500 })
    }
}
