import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

        // Get redemption history
        const { data: redemptions, error } = await supabaseAdmin
            .from('reward_redemptions')
            .select(`
        id,
        points_used,
        code,
        status,
        created_at,
        reward:rewards (
          name,
          type,
          value
        )
      `)
            .eq('user_id', payload.userId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Get redemption history error:', error)
            return NextResponse.json({ history: [] })
        }

        return NextResponse.json({
            history: redemptions || []
        })

    } catch (error) {
        console.error('Get redemption history error:', error)
        return NextResponse.json({ history: [] })
    }
}
