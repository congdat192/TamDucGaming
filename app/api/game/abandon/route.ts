import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth-token')?.value

        if (!token) {
            return NextResponse.json(
                { error: 'Chưa đăng nhập' },
                { status: 401 }
            )
        }

        const payload = verifyToken(token)
        if (!payload) {
            return NextResponse.json(
                { error: 'Token không hợp lệ' },
                { status: 401 }
            )
        }

        const { gameToken } = await request.json()

        if (!gameToken) {
            return NextResponse.json(
                { error: 'Missing game token' },
                { status: 400 }
            )
        }

        // Invalidate the session
        const { error } = await supabaseAdmin
            .from('game_sessions')
            .update({
                status: 'invalid',
                suspicion_reason: 'User left game without completing'
            })
            .eq('game_token', gameToken)
            .eq('user_id', payload.userId)
            .eq('status', 'started')

        if (error) {
            console.error('[ABANDON SESSION] Error:', error)
            return NextResponse.json(
                { error: 'Failed to abandon session' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[ABANDON SESSION] Error:', error)
        return NextResponse.json(
            { error: 'Internal error' },
            { status: 500 }
        )
    }
}
