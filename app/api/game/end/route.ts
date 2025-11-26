import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, verifyGameToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getGameConfig } from '@/lib/gameConfig'
import { VOUCHER_TIERS } from '@/lib/voucher'
import { notifyReferralBonus, notifyCanRedeemVoucher } from '@/lib/notifications'
import { sendReferralCompletionEmail } from '@/lib/email'
import { rateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

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

    // Rate limiting: 5 requests per minute per user
    const rateLimitResult = rateLimit(`game-end:${payload.userId}`, {
      maxRequests: 5,
      windowMs: 60 * 1000 // 1 minute
    })

    if (!rateLimitResult.success) {
      console.warn(`[RATE LIMIT] User ${payload.userId} exceeded rate limit`)
      return NextResponse.json(
        { error: 'Quá nhiều request, vui lòng chờ 1 phút' },
        { status: 429 }
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

    // Anti-Cheat: Improved duration vs score validation
    const currentTimestamp = Date.now()
    const durationSeconds = (currentTimestamp - gamePayload.startTime) / 1000

    // Check 1: Minimum game duration (prevent instant submission)
    if (durationSeconds < 5) {
      console.warn(`[ANTI-CHEAT] Game too short: ${durationSeconds}s (User: ${payload.userId})`)
      return NextResponse.json(
        { error: 'Game quá ngắn (nghi vấn hack)' },
        { status: 400 }
      )
    }

    // Check 2: Maximum game duration (token expires after 1h)
    if (durationSeconds > 3600) {
      console.warn(`[ANTI-CHEAT] Game too long: ${durationSeconds}s (User: ${payload.userId})`)
      return NextResponse.json(
        { error: 'Game quá lâu, vui lòng chơi lại' },
        { status: 400 }
      )
    }

    // Check 3: Score vs duration (stricter: 2 points/sec max)
    const maxPossibleScore = Math.floor(durationSeconds * 2)
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

    // Anti-Cheat: Check if session already submitted (prevent replay attack)
    const { data: existingSession } = await supabaseAdmin
      .from('game_sessions')
      .select('id')
      .eq('session_id', gamePayload.sessionId)
      .single()

    if (existingSession) {
      console.warn(`[ANTI-CHEAT] Session already submitted: ${gamePayload.sessionId} (User: ${payload.userId})`)
      return NextResponse.json(
        { error: 'Game session đã được submit rồi' },
        { status: 400 }
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

    // Save game session with session_id
    const { error: sessionError } = await supabaseAdmin
      .from('game_sessions')
      .insert({
        session_id: gamePayload.sessionId,
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

    // Update user's total score (CRITICAL: Must succeed)
    const newTotalScore = user.total_score + score
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        total_score: newTotalScore
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[GAME END] CRITICAL: Failed to update user score:', updateError)
      return NextResponse.json(
        { error: 'Không thể cập nhật điểm số' },
        { status: 500 }
      )
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
          const sent = await sendReferralCompletionEmail(
            referrer.email,
            config.bonusPlaysForReferral,
            user.email || user.phone || 'Người dùng mới'
          )
          if (sent) {
            console.log(`[REFERRAL EMAIL] Sent to ${referrer.email}`)
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
