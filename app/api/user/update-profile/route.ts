import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

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

    const { name } = await request.json()

    // Update user profile
    const { error } = await supabase
      .from('users')
      .update({ name })
      .eq('id', payload.userId)

    if (error) {
      console.error('Update profile error:', error)
      return NextResponse.json(
        { error: 'Không thể cập nhật thông tin' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thành công'
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
