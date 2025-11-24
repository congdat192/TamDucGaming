import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendVoucherEmail } from '@/lib/email'

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

    // Get voucher details
    const { data: voucher, error: voucherError } = await supabaseAdmin
      .from('vouchers')
      .select('*')
      .eq('code', voucherCode)
      .single()

    if (voucherError || !voucher) {
      return NextResponse.json(
        { error: 'Không tìm thấy voucher' },
        { status: 404 }
      )
    }

    // Format voucher info
    const expiresAtFormatted = new Date(voucher.expires_at).toLocaleDateString('vi-VN')
    const voucherLabel = voucher.value >= 1000000
      ? `${(voucher.value / 1000000).toFixed(0)} triệu`
      : `${(voucher.value / 1000).toFixed(0)}K`

    // Send email via email service (with fallback)
    const sent = await sendVoucherEmail(email, voucherLabel, voucherCode, expiresAtFormatted)

    if (!sent) {
      return NextResponse.json(
        { error: 'Không thể gửi email' },
        { status: 500 }
      )
    }

    // Update voucher with sent email
    await supabaseAdmin
      .from('vouchers')
      .update({ sent_to_email: email })
      .eq('code', voucherCode)

    console.log(`[VOUCHER EMAIL] Sent ${voucherCode} to ${email}`)

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
