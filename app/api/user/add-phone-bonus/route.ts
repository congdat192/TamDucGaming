import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const PHONE_BONUS_PLAYS = 3

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

    const { phone } = await request.json()

    // Validate phone
    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { error: 'Số điện thoại không hợp lệ' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    // Check if user already has phone
    if (user.phone) {
      return NextResponse.json(
        { error: 'Bạn đã cập nhật số điện thoại rồi' },
        { status: 400 }
      )
    }

    // Check if phone already exists in another account
    const { data: existingPhone } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single()

    if (existingPhone) {
      return NextResponse.json(
        { error: 'Số điện thoại này đã được sử dụng bởi tài khoản khác' },
        { status: 400 }
      )
    }

    // Update user with phone and add bonus plays
    const { error: updateError } = await supabase
      .from('users')
      .update({
        phone,
        bonus_plays: (user.bonus_plays || 0) + PHONE_BONUS_PLAYS
      })
      .eq('id', payload.userId)

    if (updateError) {
      console.error('Update phone error:', updateError)
      return NextResponse.json(
        { error: 'Không thể cập nhật số điện thoại' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Đã thêm ${PHONE_BONUS_PLAYS} lượt chơi! Cảm ơn bạn đã cập nhật số điện thoại.`,
      bonusPlays: PHONE_BONUS_PLAYS
    })

  } catch (error) {
    console.error('Add phone bonus error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
