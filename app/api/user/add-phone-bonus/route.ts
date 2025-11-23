import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getGameConfig } from '@/lib/gameConfig'
import { sendReferralBonusEmail } from '@/lib/email'

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

    // Get config from database
    const config = await getGameConfig()

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

    // Update user with phone and add bonus plays (using config from DB)
    const bonusPlays = config.bonusPlaysForPhone

    // 1. Update phone number first
    const { error: updatePhoneError } = await supabase
      .from('users')
      .update({ phone })
      .eq('id', payload.userId)

    if (updatePhoneError) {
      console.error('Update phone error:', updatePhoneError)
      return NextResponse.json(
        { error: 'Không thể cập nhật số điện thoại' },
        { status: 500 }
      )
    }

    // 2. Add bonus plays via RPC
    const { error: rpcError } = await supabase.rpc('add_bonus_plays', {
      target_user_id: payload.userId,
      bonus_amount: bonusPlays,
      reason_text: 'phone_update'
    })

    if (rpcError) {
      console.error('Error adding bonus plays via RPC:', rpcError)
      // Fallback: manually update bonus plays if RPC fails
      await supabase
        .from('users')
        .update({
          bonus_plays: (user.bonus_plays || 0) + bonusPlays
        })
        .eq('id', payload.userId)
    }

    // Check for referrer and award bonus
    try {
      console.log('Checking referral for user:', payload.userId)

      // Find referral record where this user is the referee
      const { data: referral, error: referralError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_id', payload.userId)
        .eq('reward_given', false)
        .maybeSingle()

      if (referralError) {
        console.error('Referral lookup error:', referralError.message)
      }

      if (referral) {
        console.log('Found referral record:', referral)

        // Get referrer info including email
        const { data: referrer, error: referrerError } = await supabase
          .from('users')
          .select('id, bonus_plays, email')
          .eq('id', referral.referrer_id)
          .single()

        if (referrerError) {
          console.error('Error fetching referrer:', referrerError)
        }

        if (referrer) {
          console.log('Found referrer:', referrer.id)
          const referralBonus = config.bonusPlaysForReferral || 5

          // Use RPC to add bonus plays and log transaction
          const { error: rpcError } = await supabase.rpc('add_bonus_plays', {
            target_user_id: referrer.id,
            bonus_amount: referralBonus,
            reason_text: 'referral_bonus',
            related_id: payload.userId // The new user who added phone
          })

          if (rpcError) {
            console.error('Error calling add_bonus_plays RPC:', rpcError)
            // Fallback to direct update if RPC fails (though RPC is preferred)
            const { error: updateBonusError } = await supabase
              .from('users')
              .update({
                bonus_plays: (referrer.bonus_plays || 0) + referralBonus
              })
              .eq('id', referrer.id)

            if (updateBonusError) console.error('Fallback update failed:', updateBonusError)
          } else {
            console.log(`Awarded ${referralBonus} plays to referrer ${referrer.id} via RPC`)
          }

          // Mark referral as rewarded
          const { error: updateReferralError } = await supabase
            .from('referrals')
            .update({ reward_given: true })
            .eq('id', referral.id)

          if (updateReferralError) {
            console.error('Error marking referral as rewarded:', updateReferralError)
          }

          // Send email notification to referrer
          if (referrer.email) {
            console.log('Sending email to referrer:', referrer.email)
            // user is the referee (current user updating phone)
            const emailResult = await sendReferralBonusEmail(referrer.email, referralBonus, user.email || 'một người bạn')
            console.log(`Sent referral bonus email result: ${emailResult}`)
          } else {
            console.log('Referrer has no email')
          }
        } else {
          console.log('Referrer not found for ID:', referral.referrer_id)
        }
      } else {
        console.log('No pending referral found for user:', payload.userId)
      }
    } catch (refError) {
      console.error('Error processing referral reward:', refError)
      // Don't fail the main request if referral reward fails
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
