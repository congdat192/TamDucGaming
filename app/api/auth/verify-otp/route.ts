import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateToken, generateReferralCode } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { phone, email, otp, referralCode } = await request.json()

    const isEmailLogin = !!email
    const identifier = isEmailLogin ? email : phone

    if (!identifier || !otp) {
      return NextResponse.json(
        { error: 'Thiếu thông tin' },
        { status: 400 }
      )
    }

    // Check OTP based on login type
    let otpQuery = supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('code', otp)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())

    if (isEmailLogin) {
      otpQuery = otpQuery.eq('email', email)
    } else {
      otpQuery = otpQuery.eq('phone', phone)
    }

    const { data: otpRecord, error: otpError } = await otpQuery.single()

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: 'Mã OTP không đúng hoặc đã hết hạn' },
        { status: 400 }
      )
    }

    // Mark OTP as verified
    await supabaseAdmin
      .from('otp_codes')
      .update({ verified: true })
      .eq('id', otpRecord.id)

    // Check if user exists
    let userQuery = supabaseAdmin
      .from('users')
      .select('*')

    if (isEmailLogin) {
      userQuery = userQuery.eq('email', email)
    } else {
      userQuery = userQuery.eq('phone', phone)
    }

    let { data: user } = await userQuery.single()

    const isNewUser = !user

    if (!user) {
      // Create new user
      const newReferralCode = generateReferralCode()

      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          phone: isEmailLogin ? null : phone,
          email: isEmailLogin ? email : null,
          referral_code: newReferralCode,
          plays_today: 0,
          bonus_plays: 0,
          total_score: 0
        })
        .select()
        .single()

      if (createError) {
        console.error('Failed to create user:', createError)
        return NextResponse.json(
          { error: 'Không thể tạo tài khoản' },
          { status: 500 }
        )
      }

      user = newUser

      // Process referral if provided
      if (referralCode && user) {
        const { data: referrer } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('referral_code', referralCode.toUpperCase())
          .single()

        if (referrer && referrer.id !== user.id) {
          // Create referral record
          await supabaseAdmin
            .from('referrals')
            .insert({
              referrer_id: referrer.id,
              referred_id: user.id,
              reward_given: false
            })
        }
      }
    }

    // Check if today is a new day, reset plays_today
    const today = new Date().toISOString().split('T')[0]
    if (user.last_play_date !== today) {
      await supabaseAdmin
        .from('users')
        .update({
          plays_today: 0,
          last_play_date: today
        })
        .eq('id', user.id)

      user.plays_today = 0
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      phone: user.phone,
      email: user.email
    })

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        referral_code: user.referral_code,
        plays_today: user.plays_today,
        bonus_plays: user.bonus_plays,
        total_score: user.total_score
      },
      isNewUser
    })

  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}
