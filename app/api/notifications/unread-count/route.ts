import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getUnreadCount } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

// GET - Đếm số notifications chưa đọc
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ count: 0 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ count: 0 })
    }

    const count = await getUnreadCount(payload.userId)

    return NextResponse.json({
      success: true,
      count
    })

  } catch (error) {
    console.error('[NOTIFICATIONS] Error counting:', error)
    return NextResponse.json({ count: 0 })
  }
}
