import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getGameConfig } from '@/lib/gameConfig'
import { notifyReferralBonus } from '@/lib/notifications'
import { sendReferralBonusEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Supabase Edge Function URL
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

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

    const { phone, otp } = await request.json()

    // Get config from database
    const config = await getGameConfig()

    // Validate phone
    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { error: 'Số điện thoại không hợp lệ' },
        { status: 400 }
      )
    }

    // ========== OTP VERIFICATION (REQUIRED) - Call Edge Function ==========
    if (!otp) {
      return NextResponse.json(
        { error: 'Vui lòng nhập mã OTP' },
        { status: 400 }
      )
    }

    // Call Supabase Edge Function verify_otp_phone
    try {
      console.log(`[VERIFY OTP] Calling edge function for phone: ${phone}`)

      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/verify_otp_phone`
      const verifyResponse = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ phone, otp })
      })

      const verifyResult = await verifyResponse.json()

      if (!verifyResponse.ok) {
        console.error(`[VERIFY OTP] Edge function error:`, verifyResult)
        return NextResponse.json(
          { error: verifyResult.error || 'Mã OTP không đúng hoặc đã hết hạn' },
          { status: verifyResponse.status }
        )
      }

      console.log(`[VERIFY OTP] Edge function success:`, verifyResult)

    } catch (verifyError) {
      console.error('[VERIFY OTP] Failed to call edge function:', verifyError)
      return NextResponse.json(
        { error: 'Không thể xác thực OTP. Vui lòng thử lại.' },
        { status: 500 }
      )
    }
    // ========== END OTP VERIFICATION ==========

    // Get current user
    const { data: user, error: userError } = await supabaseAdmin
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
    const { data: existingPhone } = await supabaseAdmin
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

    // Update user with phone and add bonus plays (using config from DB)
    const bonusPlays = config.bonusPlaysForPhone

    // 1. Update phone number first (using admin client for proper permissions)
    // Also set phone_verified = true since OTP was verified
    const { error: updatePhoneError } = await supabaseAdmin
      .from('users')
      .update({
        phone,
        phone_verified: true,
        phone_verified_at: new Date().toISOString()
      })
      .eq('id', payload.userId)

    if (updatePhoneError) {
      console.error('Update phone error:', updatePhoneError)
      return NextResponse.json(
        { error: 'Không thể cập nhật số điện thoại' },
        { status: 500 }
      )
    }

    // 2. Add bonus plays via RPC (using admin client for proper permissions)
    const { error: rpcError } = await supabaseAdmin.rpc('add_bonus_plays', {
      target_user_id: payload.userId,
      bonus_amount: bonusPlays,
      reason_text: 'phone_update'
    })

    if (rpcError) {
      console.error('Error adding bonus plays via RPC:', rpcError)
      // Fallback: manually update bonus plays if RPC fails
      await supabaseAdmin
        .from('users')
        .update({
          bonus_plays: (user.bonus_plays || 0) + bonusPlays
        })
        .eq('id', payload.userId)
    }

    // Referral bonus is now handled by database trigger 'on_user_phone_update'
    // This ensures data integrity and simplifies the API logic.

    // Send email notification to referrer if exists
    try {
      const { data: referral } = await supabaseAdmin
        .from('referrals')
        .select('referrer_id')
        .eq('referred_id', payload.userId)
        .eq('reward_given', true)
        .single()

      if (referral) {
        // Get referrer info
        const { data: referrer } = await supabaseAdmin
          .from('users')
          .select('email')
          .eq('id', referral.referrer_id)
          .single()

        if (referrer) {
          // Send in-app notification
          await notifyReferralBonus(referral.referrer_id, config.bonusPlaysForReferral)
          console.log(`[REFERRAL NOTIFICATION] Phone update bonus for ${referral.referrer_id}`)

          // Send email notification if referrer has email
          if (referrer.email) {
            const sent = await sendReferralBonusEmail(
              referrer.email,
              config.bonusPlaysForReferral,
              user.email || phone
            )
            if (sent) {
              console.log(`[REFERRAL EMAIL] Phone update - sent to ${referrer.email}`)
            }
          }
        }
      }
    } catch (notifyError) {
      console.error('Failed to send referral notification:', notifyError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: `Đã thêm ${bonusPlays} lượt chơi! Cảm ơn bạn đã cập nhật số điện thoại.`,
      bonusPlays
    })

  } catch (error) {
    console.error('Add phone bonus error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
