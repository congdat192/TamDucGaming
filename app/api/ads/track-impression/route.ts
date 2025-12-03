import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { ad_content_id, placement_key, session_id } = body

        if (!ad_content_id || !placement_key) {
            return NextResponse.json(
                { error: 'ad_content_id and placement_key are required' },
                { status: 400 }
            )
        }

        // Get current user (optional)
        const user = await getCurrentUser()

        // Insert impression
        const { error } = await supabaseAdmin
            .from('ad_impressions')
            .insert({
                ad_content_id,
                placement_key,
                user_id: user?.id || null,
                session_id: session_id || null
            })

        if (error) {
            console.error('[API] Failed to track impression:', error)
            return NextResponse.json(
                { error: 'Failed to track impression' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API] /api/ads/track-impression error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
