import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { markAsRead, markAllAsRead } from '@/lib/notifications'

// POST - Đánh dấu đã đọc
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

    const { notificationId, markAll } = await request.json()

    let success = false

    if (markAll) {
      success = await markAllAsRead(payload.userId)
    } else if (notificationId) {
      success = await markAsRead(notificationId, payload.userId)
    } else {
      return NextResponse.json(
        { error: 'Thiếu notificationId hoặc markAll' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success })

  } catch (error) {
    console.error('[NOTIFICATIONS] Mark read error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
