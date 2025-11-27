import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateOTP } from '@/lib/auth'
import { sendOtpEmail } from '@/lib/email'
import { sendVihatOTP, isValidVietnamesePhone, formatPhoneForVihat } from '@/lib/vihat'

// Rate limit constants - BẢO VỆ CHI PHÍ SMS
const RATE_LIMITS = {
  DELAY_BETWEEN_MS: 60000,      // 60s giữa các request cùng SĐT
  MAX_PER_PHONE_HOUR: 5,        // 5 OTP/phone/hour
  MAX_PER_IP_HOUR: 20,          // 20 OTP/IP/hour (chặn spam nhiều SĐT từ 1 IP)
  MAX_DAILY_COST_VND: 200000,   // Giới hạn chi phí 200,000 VND/ngày
}

const SMS_COST = 500 // VND per SMS

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

export async function POST(request: NextRequest) {
  try {
    const { phone, email, referralCode } = await request.json()

    const isEmailLogin = !!email
    const clientIP = getClientIP(request)

    // ========== PHONE OTP: Use otp_login_vihat table ==========
    if (!isEmailLogin) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      // 1. IP Rate Limit - Chặn spam từ 1 IP
      const { count: ipCount } = await supabaseAdmin
        .from('otp_login_vihat')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', clientIP)
        .gte('created_at', oneHourAgo)

      if (ipCount && ipCount >= RATE_LIMITS.MAX_PER_IP_HOUR) {
        console.warn(`[SECURITY] IP ${clientIP} exceeded rate limit: ${ipCount} requests/hour`)
        return NextResponse.json(
          { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 1 giờ.' },
          { status: 429 }
        )
      }

      // 2. Daily Cost Cap - Bảo vệ chi phí SMS
      const todayStart = new Date()
      todayStart.setUTCHours(0, 0, 0, 0)

      const { data: todayOTPs } = await supabaseAdmin
        .from('otp_login_vihat')
        .select('cost')
        .gte('created_at', todayStart.toISOString())

      const totalCostToday = todayOTPs?.reduce((sum, record) => {
        return sum + parseFloat(String(record.cost) || '0')
      }, 0) || 0

      if (totalCostToday >= RATE_LIMITS.MAX_DAILY_COST_VND) {
        console.error(`[SECURITY ALERT] Daily SMS cost cap reached: ${totalCostToday}/${RATE_LIMITS.MAX_DAILY_COST_VND} VND`)
        return NextResponse.json(
          { error: 'Hệ thống đang quá tải. Vui lòng thử lại sau hoặc đăng nhập bằng email.' },
          { status: 503 }
        )
      }
    }

    // ========== END GLOBAL PROTECTION ==========

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

      // Validate Vietnamese phone format
      if (!isValidVietnamesePhone(phone)) {
        return NextResponse.json(
          { error: 'Số điện thoại không đúng định dạng Việt Nam' },
          { status: 400 }
        )
      }

      // Rate limit: Check delay between requests for same phone (use otp_login_vihat)
      const { data: lastOTP } = await supabaseAdmin
        .from('otp_login_vihat')
        .select('created_at')
        .eq('phone', phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (lastOTP) {
        const lastRequestTime = new Date(lastOTP.created_at).getTime()
        const timeSinceLastOTP = Date.now() - lastRequestTime
        if (timeSinceLastOTP < RATE_LIMITS.DELAY_BETWEEN_MS) {
          const waitTime = Math.ceil((RATE_LIMITS.DELAY_BETWEEN_MS - timeSinceLastOTP) / 1000)
          return NextResponse.json(
            { error: `Vui lòng đợi ${waitTime} giây trước khi gửi lại` },
            { status: 429 }
          )
        }
      }

      // Rate limit: Check max OTP per phone per hour (use otp_login_vihat)
      const phoneOneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { count: phoneCount } = await supabaseAdmin
        .from('otp_login_vihat')
        .select('*', { count: 'exact', head: true })
        .eq('phone', phone)
        .gte('created_at', phoneOneHourAgo)

      if (phoneCount && phoneCount >= RATE_LIMITS.MAX_PER_PHONE_HOUR) {
        return NextResponse.json(
          { error: 'Số điện thoại đã vượt giới hạn 5 lần/giờ' },
          { status: 429 }
        )
      }
    }

    // Generate OTP
    const otp = generateOTP(isEmailLogin ? email : undefined)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes

    // ========== EMAIL OTP: Use otp_codes table ==========
    if (isEmailLogin) {
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
    }

    // ========== PHONE OTP: Use otp_login_vihat table ==========
    // Insert OTP record first
    const { data: otpRecord, error: insertError } = await supabaseAdmin
      .from('otp_login_vihat')
      .insert({
        phone: phone,
        otp_code: otp,
        minute: 5,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0,
        ip_address: clientIP,
        cost: SMS_COST,
        brandname: 'MKTAMDUC',
        campaign_id: 'Game MKTD Login',
        channel_sent: 'pending'
      })
      .select()
      .single()

    if (insertError || !otpRecord) {
      console.error('Failed to store phone OTP:', insertError)
      return NextResponse.json(
        { error: 'Không thể gửi OTP. Vui lòng thử lại.' },
        { status: 500 }
      )
    }

    console.log(`[OTP] Created record ${otpRecord.id} for phone ${phone}`)

    // Check if MOCK mode is enabled (for development/testing)
    if (process.env.MOCK_OTP_ENABLED === 'true') {
      console.log(`[MOCK OTP] Phone: ${phone}, OTP: ${otp}`)

      // Update record as mock sent
      await supabaseAdmin
        .from('otp_login_vihat')
        .update({ channel_sent: 'mock', notes: 'MOCK mode - not sent' })
        .eq('id', otpRecord.id)

      return NextResponse.json({
        success: true,
        message: 'OTP đã được gửi qua SMS',
        record_id: otpRecord.id,
        debug_otp: otp // Include OTP for testing
      })
    }

    // Send OTP via VIHAT MultiChannel (ZNS first → auto fallback SMS)
    const formattedPhone = formatPhoneForVihat(phone)
    const otpResult = await sendVihatOTP(formattedPhone, otp, 5, otpRecord.id)

    if (!otpResult.success) {
      console.error(`[VIHAT] Failed to send OTP to ${phone}:`, otpResult.error)

      // Update record as failed
      await supabaseAdmin
        .from('otp_login_vihat')
        .update({
          channel_sent: 'failed',
          notes: `VIHAT error: ${otpResult.error}`
        })
        .eq('id', otpRecord.id)

      return NextResponse.json(
        { error: otpResult.message || 'Không thể gửi OTP. Vui lòng thử lại.' },
        { status: 500 }
      )
    }

    // Update record with VIHAT response
    // channel_sent sẽ được webhook cập nhật sau khi biết ZNS hay SMS thành công
    await supabaseAdmin
      .from('otp_login_vihat')
      .update({
        channel_sent: 'pending', // API accepted, waiting for ZNS/SMS delivery
        sms_request_id: otpResult.smsId,
        zns_request_id: otpResult.smsId, // Same ID for both channels
        notes: `MultiChannel accepted - SMSID: ${otpResult.smsId} (ZNS→SMS fallback)`
      })
      .eq('id', otpRecord.id)

    console.log(`[VIHAT] OTP sent to ${phone} via MultiChannel, SMSID: ${otpResult.smsId}`)

    return NextResponse.json({
      success: true,
      message: otpResult.message,
      record_id: otpRecord.id
    })

  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}
