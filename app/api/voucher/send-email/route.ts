import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getEmailTemplates } from '@/lib/emailTemplates'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    // Get email template
    const templates = await getEmailTemplates()
    const emailTemplate = templates.voucherClaim
    const expiresAtFormatted = new Date(voucher.expires_at).toLocaleDateString('vi-VN')

    // Format voucher label based on value
    const voucherLabel = voucher.value >= 1000000
      ? `${(voucher.value / 1000000).toFixed(0)} triệu`
      : `${(voucher.value / 1000).toFixed(0)}K`

    // Replace placeholders
    const html = emailTemplate.htmlTemplate
      .replace(/{{voucherLabel}}/g, voucherLabel)
      .replace(/{{voucherCode}}/g, voucherCode)
      .replace(/{{expiresAt}}/g, expiresAtFormatted)

    const subject = emailTemplate.subject.replace('{{voucherLabel}}', voucherLabel)

    // Send email via Resend
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: `${emailTemplate.fromName} <${emailTemplate.fromEmail}>`,
      to: email,
      subject,
      html
    })

    if (emailError) {
      console.error('[VOUCHER SEND EMAIL] Failed:', emailError)
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

    console.log(`[VOUCHER EMAIL] Sent ${voucherCode} to ${email}, ID: ${emailResult?.id}`)

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
