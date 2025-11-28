import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateOTP } from '@/lib/auth'
import { sendOtpEmail } from '@/lib/email'

// Supabase Edge Function URL
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Lấy IP từ request headers
 * Hỗ trợ Vercel, Cloudflare, nginx proxy
 */
function getClientIP(request: NextRequest): string {
  // Vercel
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // Cloudflare
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Real IP header (nginx)
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  return 'unknown'
}

/**
 * Validate Vietnamese phone number
 */
function isValidVietnamesePhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '')
  const regex = /^(0|\+?84)(3[2-9]|5[2689]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/
  return regex.test(cleaned)
}

export async function POST(request: NextRequest) {
  try {
    const { phone, email } = await request.json()

    const isEmailLogin = !!email
    const clientIP = getClientIP(request)

    // ========== PHONE OTP: Call Supabase Edge Function ==========
    if (!isEmailLogin) {
      // Validate phone
      if (!phone || phone.length < 10) {
        return NextResponse.json(
          { error: 'Số điện thoại không hợp lệ' },
          { status: 400 }
        )
      }

      // Validate Vietnamese phone format
      if (!isValidVietnamesePhone(phone)) {
        return NextResponse.json(
          { error: 'Số điện thoại không đúng định dạng Việt Nam' },
          { status: 400 }
        )
      }

      // Call Supabase Edge Function send_otp_phone
      try {
        console.log(`[PHONE OTP] Calling edge function for phone: ${phone}`)

        const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/send_otp_phone`
        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'x-forwarded-for': clientIP
          },
          body: JSON.stringify({ phone })
        })

        const result = await response.json()

        if (!response.ok) {
          console.error(`[PHONE OTP] Edge function error:`, result)
          return NextResponse.json(
            { error: result.error || 'Không thể gửi OTP. Vui lòng thử lại.' },
            { status: response.status }
          )
        }

        console.log(`[PHONE OTP] Edge function success:`, result)
        return NextResponse.json({
          success: true,
          message: result.message || 'OTP đã được gửi qua SMS',
          record_id: result.record_id
        })

      } catch (error) {
        console.error('[PHONE OTP] Failed to call edge function:', error)
        return NextResponse.json(
          { error: 'Không thể gửi OTP. Vui lòng thử lại.' },
          { status: 500 }
        )
      }
    }

    // ========== EMAIL OTP: Use otp_codes table ==========
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      )
    }

    // Generate OTP
    const otp = generateOTP(email)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes

    // Delete old OTP codes for this email
    await supabaseAdmin
      .from('otp_codes')
      .delete()
      .eq('email', email)

    // Store OTP in otp_codes
    const { error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .insert({
        email: email,
        code: otp,
        expires_at: expiresAt.toISOString(),
        verified: false,
        request_ip: clientIP
      })

    if (otpError) {
      console.error('Failed to store email OTP:', otpError)
      return NextResponse.json(
        { error: 'Không thể gửi OTP. Vui lòng thử lại.' },
        { status: 500 }
      )
    }

    // Send email OTP
    const sent = await sendOtpEmail(email, otp)
    if (sent) {
      console.log(`[EMAIL OTP] Sent to: ${email}`)
    } else {
      console.log(`[EMAIL OTP] Failed to send to: ${email}, OTP: ${otp}`)
    }

    return NextResponse.json({
      success: true,
      message: 'OTP đã được gửi qua email',
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
