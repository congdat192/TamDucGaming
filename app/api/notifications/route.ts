import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getUserNotifications } from '@/lib/notifications'

// GET - Lấy danh sách notifications của user
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const notifications = await getUserNotifications(payload.userId, limit)

    return NextResponse.json({
      success: true,
      notifications
    })

  } catch (error) {
    console.error('[NOTIFICATIONS] Error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
