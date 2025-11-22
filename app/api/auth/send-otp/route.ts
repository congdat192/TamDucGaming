import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateOTP } from '@/lib/auth'
import { Resend } from 'resend'

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
        const { data, error: resendError } = await resend.emails.send({
          from: 'Santa Jump <gaming@matkinhtamduc.com>',
          to: email,
          subject: '🎅 Mã OTP đăng nhập Santa Jump',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 30px; border-radius: 15px; text-align: center;">
                <h1 style="color: #FFD700; margin: 0; font-size: 28px;">🎅 SANTA JUMP 🎄</h1>
                <p style="color: #22c55e; margin: 10px 0; font-size: 18px;">Mắt Kính Tâm Đức</p>
              </div>
              <div style="background: #f0f9ff; padding: 30px; border-radius: 15px; margin-top: 20px; text-align: center;">
                <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Mã OTP của bạn là:</p>
                <div style="background: #1e3a5f; color: #FFD700; font-size: 36px; font-weight: bold; padding: 20px 40px; border-radius: 10px; letter-spacing: 8px; display: inline-block;">
                  ${otp}
                </div>
                <p style="color: #666; font-size: 14px; margin-top: 20px;">Mã có hiệu lực trong 5 phút</p>
              </div>
              <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
                By Chief Everything Officer
              </p>
            </div>
          `
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
