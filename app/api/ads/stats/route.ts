import { NextRequest, NextResponse } from 'next/server'
import { getAdStats } from '@/lib/ads'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const placementKey = searchParams.get('placement_key') || undefined

        const stats = await getAdStats(placementKey)

        if (!stats) {
            return NextResponse.json(
                { error: 'Failed to fetch stats' },
                { status: 500 }
            )
        }

        return NextResponse.json({ stats })
    } catch (error) {
        console.error('[API] /api/ads/stats error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
