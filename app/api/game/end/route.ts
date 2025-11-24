import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, generateVoucherCode, verifyGameToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getGameConfig } from '@/lib/gameConfig'
import { getVoucherByScore, VOUCHER_TIERS } from '@/lib/voucher'
import { Resend } from 'resend'
import { notifyReferralBonus, notifyCanRedeemVoucher } from '@/lib/notifications'
import { getEmailTemplates } from '@/lib/emailTemplates'

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
    console.log(`[GAME END] Received score: ${score}, token: ${gameToken?.substring(0, 10)}...`)

    if (typeof score !== 'number' || score < 0) {
      console.error('[GAME END] Invalid score')
      return NextResponse.json(
        { error: 'Điểm không hợp lệ' },
        { status: 400 }
      )
    }

    // Verify Game Token
    if (!gameToken) {
      console.error('[GAME END] Missing game token')
      return NextResponse.json(
        { error: 'Thiếu game token' },
        { status: 400 }
      )
    }

    const gamePayload = verifyGameToken(gameToken)
    if (!gamePayload) {
      console.error('[GAME END] Invalid game token')
      return NextResponse.json(
        { error: 'Game token không hợp lệ hoặc đã hết hạn' },
        { status: 400 }
      )
    }

    if (gamePayload.userId !== payload.userId) {
      console.error(`[GAME END] Token mismatch. Token user: ${gamePayload.userId}, Auth user: ${payload.userId}`)
      return NextResponse.json(
        { error: 'Game token không khớp với người dùng' },
        { status: 403 }
      )
    }

    // Anti-Cheat: Check duration vs score
    const currentTimestamp = Date.now()
    const durationSeconds = (currentTimestamp - gamePayload.startTime) / 1000
    const maxPossibleScore = Math.ceil(durationSeconds * 5) + 10 // 5 points/sec + 10 buffer

    console.log(`[GAME END] Duration: ${durationSeconds}s, Score: ${score}, Max: ${maxPossibleScore}`)

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
      console.error('[GAME END] User not found:', userError)
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    // Get active campaign
    const now = new Date().toISOString()
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .limit(1)

    const activeCampaign = campaign && campaign.length > 0 ? campaign[0] : null

    if (campaignError) {
      console.error('[GAME END] Error fetching campaign:', campaignError)
    }

    // Save game session
    const { error: sessionError } = await supabaseAdmin
      .from('game_sessions')
      .insert({
        user_id: user.id,
        score,
        campaign_id: activeCampaign?.id || null
      })

    if (sessionError) {
      console.error('Failed to save game session:', sessionError)
      return NextResponse.json(
        { error: 'Không thể lưu kết quả chơi' },
        { status: 500 }
      )
    }

    // Update user's total score
    const newTotalScore = user.total_score + score
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        total_score: newTotalScore
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[GAME END] Failed to update user score:', updateError)
    }

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

        // Send in-app notification to referrer
        try {
          await notifyReferralBonus(referral.referrer_id, config.bonusPlaysForReferral)
          console.log(`[REFERRAL NOTIFICATION] Created for ${referral.referrer_id}`)
        } catch (notifyError) {
          console.error('Failed to create referral notification:', notifyError)
        }

        // Send email notification to referrer
        if (referrer.email) {
          try {
            // Get email templates from database
            const templates = await getEmailTemplates()
            const emailTemplate = templates.referralCompletion
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://game-noel.vercel.app'

            // Replace placeholders
            const html = emailTemplate.htmlTemplate
              .replace(/{{bonusPlays}}/g, String(config.bonusPlaysForReferral))
              .replace(/{{appUrl}}/g, appUrl)

            const subject = emailTemplate.subject.replace('{{bonusPlays}}', String(config.bonusPlaysForReferral))

            await resend.emails.send({
              from: `${emailTemplate.fromName} <${emailTemplate.fromEmail}>`,
              to: referrer.email,
              subject,
              html
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

    // Get available vouchers based on cumulative total_score
    const availableVouchers = VOUCHER_TIERS.filter(v => newTotalScore >= v.minScore)

    // Check if user just reached a new voucher tier (notify once)
    const previousAvailableVouchers = VOUCHER_TIERS.filter(v => user.total_score >= v.minScore)
    const newlyUnlockedVoucher = availableVouchers.find(
      v => !previousAvailableVouchers.some(pv => pv.minScore === v.minScore)
    )

    if (newlyUnlockedVoucher) {
      try {
        await notifyCanRedeemVoucher(user.id, newTotalScore, newlyUnlockedVoucher.value)
        console.log(`[VOUCHER UNLOCK NOTIFICATION] Created for ${user.id} - ${newlyUnlockedVoucher.label}`)
      } catch (notifyError) {
        console.error('Failed to create voucher unlock notification:', notifyError)
      }
    }

    return NextResponse.json({
      success: true,
      score,
      totalScore: newTotalScore,
      availableVouchers // Return list of vouchers user can choose from
    })

  } catch (error) {
    console.error('End game error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
