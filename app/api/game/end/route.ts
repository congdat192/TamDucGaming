import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, generateVoucherCode, verifyGameToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getGameConfig, getVoucherByScore } from '@/lib/gameConfig'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    const { score, gameToken } = await request.json()

    if (typeof score !== 'number' || score < 0) {
      return NextResponse.json(
        { error: 'Điểm không hợp lệ' },
        { status: 400 }
      )
    }

    // Verify Game Token
    if (!gameToken) {
      return NextResponse.json(
        { error: 'Thiếu game token' },
        { status: 400 }
      )
    }

    const gamePayload = verifyGameToken(gameToken)
    if (!gamePayload) {
      return NextResponse.json(
        { error: 'Game token không hợp lệ hoặc đã hết hạn' },
        { status: 400 }
      )
    }

    if (gamePayload.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Game token không khớp với người dùng' },
        { status: 403 }
      )
    }

    // Anti-Cheat: Check duration vs score
    const currentTimestamp = Date.now()
    const durationSeconds = (currentTimestamp - gamePayload.startTime) / 1000
    const maxPossibleScore = Math.ceil(durationSeconds * 5) + 10 // 5 points/sec + 10 buffer

    if (score > maxPossibleScore) {
      console.warn(`[ANTI-CHEAT] Suspicious score: ${score} in ${durationSeconds}s (User: ${payload.userId})`)
      return NextResponse.json(
        { error: 'Điểm số không hợp lệ (nghi vấn hack)' },
        { status: 400 }
      )
    }

    // Get config from database
    const config = await getGameConfig()

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
    await supabaseAdmin
      .from('game_sessions')
      .insert({
        user_id: user.id,
        score,
        campaign_id: campaign?.id || null
      })

    // Update user's total score
    await supabaseAdmin
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
      // Give bonus play to referrer (using config from DB)
      const { data: referrer } = await supabase
        .from('users')
        .select('bonus_plays, email')
        .eq('id', referral.referrer_id)
        .single()

      if (referrer) {
        await supabaseAdmin
          .from('users')
          .update({
            bonus_plays: referrer.bonus_plays + config.bonusPlaysForReferral
          })
          .eq('id', referral.referrer_id)

        // Send email notification to referrer
        if (referrer.email) {
          try {
            await resend.emails.send({
              from: 'Santa Jump <gaming@matkinhtamduc.com>',
              to: referrer.email,
              subject: '🎁 Bạn nhận được lượt chơi mới!',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 30px; border-radius: 15px; text-align: center;">
                    <h1 style="color: #FFD700; margin: 0; font-size: 28px;">🎅 SANTA JUMP 🎄</h1>
                    <p style="color: #22c55e; margin: 10px 0; font-size: 18px;">Mắt Kính Tâm Đức</p>
                  </div>
                  <div style="background: #f0f9ff; padding: 30px; border-radius: 15px; margin-top: 20px; text-align: center;">
                    <h2 style="color: #1e3a5f; margin-top: 0;">Chúc mừng! 🎉</h2>
                    <p style="color: #333; font-size: 16px; line-height: 1.5;">
                      Bạn bè của bạn đã tham gia trò chơi và hoàn thành lượt chơi đầu tiên.
                    </p>
                    <div style="background: #22c55e; color: white; font-size: 24px; font-weight: bold; padding: 15px 30px; border-radius: 10px; display: inline-block; margin: 20px 0;">
                      +${config.bonusPlaysForReferral} Lượt Chơi
                    </div>
                    <p style="color: #666; font-size: 14px;">
                      Hãy vào game ngay để sử dụng lượt chơi mới nhé!
                    </p>
                    <a href="https://game-noel.vercel.app" style="display: inline-block; background: #FFD700; color: #000; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 25px; margin-top: 10px;">Chơi Ngay</a>
                  </div>
                  <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
                    By Chief Everything Officer
                  </p>
                </div>
              `
            })
            console.log(`[REFERRAL EMAIL] Sent to ${referrer.email}`)
          } catch (emailError) {
            console.error('Failed to send referral email:', emailError)
          }
        }
      }

      // Mark referral as rewarded
      await supabaseAdmin
        .from('referrals')
        .update({ reward_given: true })
        .eq('id', referral.id)
    }

    // Check if user qualifies for voucher (using config from DB)
    const voucherTier = getVoucherByScore(config, score)
    let voucher = null

    if (voucherTier) {
      const voucherCode = generateVoucherCode()
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 1) // Voucher valid for 1 month

      const { data: newVoucher, error: voucherError } = await supabaseAdmin
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
