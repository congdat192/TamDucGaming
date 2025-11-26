import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createBroadcastNotification, createNotification } from '@/lib/notifications'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export const dynamic = 'force-dynamic'

// Verify admin token
function verifyAdminToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string; isAdmin: boolean }
    if (decoded.isAdmin) {
      return decoded
    }
    return null
  } catch {
    return null
  }
}

// GET - Lấy danh sách notifications (có filter)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-token')?.value

    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type')

    let query = supabaseAdmin
      .from('notifications')
      .select('*, users(phone, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (type) {
      query = query.eq('type', type)
    }

    const { data, count, error } = await query

    if (error) {
      console.error('[ADMIN NOTIFICATIONS] Error:', error)
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }

    return NextResponse.json({
      notifications: data,
      total: count,
      page,
      limit
    })

  } catch (error) {
    console.error('[ADMIN NOTIFICATIONS] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Gửi notification (broadcast hoặc cá nhân)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-token')?.value

    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, message, targetType, userIds, data } = await request.json()

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title và message là bắt buộc' },
        { status: 400 }
      )
    }

    let targetUserIds: string[] = []

    if (targetType === 'all') {
      // Gửi cho tất cả users
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id')

      targetUserIds = users?.map(u => u.id) || []
    } else if (targetType === 'active') {
      // Gửi cho users hoạt động trong 7 ngày qua
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: sessions } = await supabaseAdmin
        .from('game_sessions')
        .select('user_id')
        .gte('played_at', sevenDaysAgo.toISOString())

      const uniqueUserIds = Array.from(new Set(sessions?.map(s => s.user_id) || []))
      targetUserIds = uniqueUserIds
    } else if (targetType === 'specific' && userIds?.length > 0) {
      // Gửi cho danh sách users cụ thể
      targetUserIds = userIds
    } else {
      return NextResponse.json(
        { error: 'Chọn đối tượng gửi không hợp lệ' },
        { status: 400 }
      )
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json(
        { error: 'Không có user nào để gửi' },
        { status: 400 }
      )
    }

    // Broadcast notification
    const result = await createBroadcastNotification(
      targetUserIds,
      title,
      message,
      data || {}
    )

    return NextResponse.json({
      success: true,
      sent: targetUserIds.length,
      notifications: result
    })

  } catch (error) {
    console.error('[ADMIN NOTIFICATIONS] Send error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE - Xóa notification
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-token')?.value

    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing notification id' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[ADMIN NOTIFICATIONS] Delete error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
