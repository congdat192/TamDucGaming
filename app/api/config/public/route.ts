import { NextResponse } from 'next/server'
import { getGameConfig } from '@/lib/gameConfig'

// Public endpoint - no auth required
// Only exposes non-sensitive config values
export async function GET() {
    try {
        const config = await getGameConfig()

        return NextResponse.json({
            config: {
                maxPlaysPerDay: config.maxPlaysPerDay,
                bonusPlaysForPhone: config.bonusPlaysForPhone,
                bonusPlaysForReferral: config.bonusPlaysForReferral
            }
        })

    } catch (error) {
        console.error('Get public config error:', error)
        return NextResponse.json(
            { error: 'Đã xảy ra lỗi' },
            { status: 500 }
        )
    }
}
