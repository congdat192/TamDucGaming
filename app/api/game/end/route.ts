import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, generateVoucherCode } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getVoucherByScore, VOUCHER_TIERS } from '@/lib/voucher'

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

    const { score } = await request.json()

    if (typeof score !== 'number' || score < 0) {
      return NextResponse.json(
        { error: 'Điểm không hợp lệ' },
        { status: 400 }
      )
    }

    // Get user
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

    // Get active campaign
    const now = new Date().toISOString()
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .single()

    // Save game session
    await supabase
      .from('game_sessions')
      .insert({
        user_id: user.id,
        score,
        campaign_id: campaign?.id || null
      })

    // Update user's total score
    await supabase
      .from('users')
      .update({
        total_score: user.total_score + score
      })
      .eq('id', user.id)

    // Check for referral reward (first game completed by referred user)
    const { data: referral } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', user.id)
      .eq('reward_given', false)
      .single()

    if (referral) {
      // Give bonus play to referrer
      const { data: referrer } = await supabase
        .from('users')
        .select('bonus_plays')
        .eq('id', referral.referrer_id)
        .single()

      if (referrer) {
        await supabase
          .from('users')
          .update({
            bonus_plays: referrer.bonus_plays + 1
          })
          .eq('id', referral.referrer_id)
      }

      // Mark referral as rewarded
      await supabase
        .from('referrals')
        .update({ reward_given: true })
        .eq('id', referral.id)
    }

    // Check if user qualifies for voucher
    const voucherTier = getVoucherByScore(score)
    let voucher = null

    if (voucherTier) {
      const voucherCode = generateVoucherCode()
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 1) // Voucher valid for 1 month

      const { data: newVoucher, error: voucherError } = await supabase
        .from('vouchers')
        .insert({
          user_id: user.id,
          code: voucherCode,
          value: voucherTier.value,
          score_earned: score,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

      if (!voucherError && newVoucher) {
        voucher = {
          code: voucherCode,
          value: voucherTier.value,
          label: voucherTier.label
        }
      }
    }

    return NextResponse.json({
      success: true,
      score,
      totalScore: user.total_score + score,
      voucher
    })

  } catch (error) {
    console.error('End game error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
