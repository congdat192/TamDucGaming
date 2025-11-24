import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateOTP } from '@/lib/auth'
import { Resend } from 'resend'
import { getEmailTemplates } from '@/lib/emailTemplates'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { phone, email, referralCode } = await request.json()

    const isEmailLogin = !!email

    // Validate input
    if (isEmailLogin) {
      if (!email || !email.includes('@')) {
        return NextResponse.json(
          { error: 'Email không hợp lệ' },
          { status: 400 }
        )
      }
    } else {
      if (!phone || phone.length < 10) {
        return NextResponse.json(
          { error: 'Số điện thoại không hợp lệ' },
          { status: 400 }
        )
      }
    }

    // Generate OTP (pass email for dev account check)
    const otp = generateOTP(isEmailLogin ? email : undefined)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Delete old OTP codes for this identifier
    if (isEmailLogin) {
      await supabaseAdmin
        .from('otp_codes')
        .delete()
        .eq('email', email)
    } else {
      await supabaseAdmin
        .from('otp_codes')
        .delete()
        .eq('phone', phone)
    }

    // Store OTP in database
    const { error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .insert({
        phone: isEmailLogin ? null : phone,
        email: isEmailLogin ? email : null,
        code: otp,
        expires_at: expiresAt.toISOString(),
        verified: false
      })

    if (otpError) {
      console.error('Failed to store OTP:', otpError)
      return NextResponse.json(
        { error: 'Không thể gửi OTP. Vui lòng thử lại.' },
        { status: 500 }
      )
    }

    // Send OTP
    if (isEmailLogin) {
      // Send email OTP via Resend
      try {
        // Get email templates from database
        const templates = await getEmailTemplates()
        const otpTemplate = templates.otpLogin

        // Replace placeholder with actual OTP
        const html = otpTemplate.htmlTemplate.replace('{{otp}}', otp)

        const { data, error: resendError } = await resend.emails.send({
          from: `${otpTemplate.fromName} <${otpTemplate.fromEmail}>`,
          to: email,
          subject: otpTemplate.subject,
          html
        })

        if (resendError) {
          console.error('[RESEND ERROR]', resendError)
          // Continue anyway - OTP is stored, user can still verify
        } else {
          console.log(`[EMAIL SENT] Email: ${email}, ID: ${data?.id}`)
        }
        console.log(`[EMAIL OTP] Email: ${email}, OTP: ${otp}`)
      } catch (emailError) {
        console.error('Failed to send email:', emailError)
        // Don't return error - OTP is stored, just email failed
        console.log(`[EMAIL OTP FALLBACK] Email: ${email}, OTP: ${otp}`)
      }
    } else {
      // Phone OTP - mock for now
      console.log(`[MOCK OTP] Phone: ${phone}, OTP: ${otp}`)
    }

    return NextResponse.json({
      success: true,
      message: isEmailLogin ? 'OTP đã được gửi qua email' : 'OTP đã được gửi',
      // Include OTP in development for testing (both phone and email when MOCK enabled)
      ...(process.env.MOCK_OTP_ENABLED === 'true' && { debug_otp: otp })
    })

  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}
