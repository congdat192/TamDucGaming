import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, voucherCode } = await request.json()

    if (!email || !voucherCode) {
      return NextResponse.json(
        { error: 'Thiếu thông tin' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      )
    }

    // Update voucher with email
    const { error } = await supabase
      .from('vouchers')
      .update({ sent_to_email: email })
      .eq('code', voucherCode)

    if (error) {
      console.error('Failed to update voucher:', error)
      return NextResponse.json(
        { error: 'Không thể cập nhật voucher' },
        { status: 500 }
      )
    }

    // In production, send actual email here
    // For now, just log it
    console.log(`[EMAIL] Voucher ${voucherCode} sent to ${email}`)

    return NextResponse.json({
      success: true,
      message: 'Voucher đã được gửi đến email'
    })

  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
