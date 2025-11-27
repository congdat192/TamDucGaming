import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getGameConfig } from '@/lib/gameConfig'
import { VOUCHER_TIERS } from '@/lib/voucher'
import { notifyReferralBonus, notifyCanRedeemVoucher } from '@/lib/notifications'
import { sendReferralCompletionEmail } from '@/lib/email'
import { rateLimit } from '@/lib/ratelimit'
import {
  validateScore,
  type GameConfigSnapshot,
  VALIDATION_CONSTANTS
} from '@/lib/game/validateScore'
import { getVietnamDate } from '@/lib/date'

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

    // Parse request body - client chỉ gửi gameToken và score
    const { gameToken, score } = await request.json()

    // Validate basic input
    if (!gameToken) {
      console.error('[GAME END] Missing game token')
      return NextResponse.json(
        { error: 'Thiếu game token' },
        { status: 400 }
      )
    }

    if (typeof score !== 'number') {
      console.error('[GAME END] Invalid score type')
      return NextResponse.json(
        { error: 'Điểm không hợp lệ' },
        { status: 400 }
      )
    }

    const clientScore = Math.max(0, Math.floor(score))

    // Find game session by token AND atomically claim it (prevent race condition)
    // Using UPDATE with WHERE status='started' ensures only ONE request can claim the session
    const now = new Date()
    const { data: claimedSession, error: claimError } = await supabaseAdmin
      .from('game_sessions')
      .update({
        status: 'processing' // Temporary status to prevent race condition
      })
      .eq('game_token', gameToken)
      .eq('status', 'started')
      .select('*')
      .single()

    // If no row updated, either session doesn't exist, already processed, or wrong status
    if (claimError || !claimedSession) {
      // Check if session exists but already processed
      const { data: existingSession } = await supabaseAdmin
        .from('game_sessions')
        .select('status, user_id')
        .eq('game_token', gameToken)
        .single()

      if (!existingSession) {
        console.error('[GAME END] Session not found:', gameToken)
        return NextResponse.json(
          { error: 'Không tìm thấy phiên chơi' },
          { status: 404 }
        )
      }

      if (existingSession.status !== 'started') {
        console.warn(`[ANTI-CHEAT] Session already ${existingSession.status}: ${gameToken} (User: ${payload.userId})`)
        return NextResponse.json(
          { error: 'Phiên chơi đã kết thúc hoặc không hợp lệ' },
          { status: 400 }
        )
      }

      // Unexpected error
      console.error('[GAME END] Failed to claim session:', claimError)
      return NextResponse.json(
        { error: 'Không thể xử lý phiên chơi' },
        { status: 500 }
      )
    }

    const session = claimedSession

    // Verify user owns this session
    if (session.user_id !== payload.userId) {
      // Revert the status change since this user doesn't own it
      await supabaseAdmin
        .from('game_sessions')
        .update({ status: 'started' })
        .eq('id', session.id)

      console.error(`[ANTI-CHEAT] Session user mismatch: session=${session.user_id}, auth=${payload.userId}`)
      return NextResponse.json(
        { error: 'Phiên chơi không thuộc về bạn' },
        { status: 403 }
      )
    }

    // Calculate server-side duration (using 'now' declared above)
    const startTime = new Date(session.start_time)
    const durationSeconds = Math.max(1, (now.getTime() - startTime.getTime()) / 1000)

    console.log(`[GAME END] Token: ${gameToken.substring(0, 8)}..., Client score: ${clientScore}, Duration: ${durationSeconds.toFixed(1)}s`)

    // Get today's total validated score for daily cap
    const today = getVietnamDate()
    const { data: todaySessions } = await supabaseAdmin
      .from('game_sessions')
      .select('validated_score, start_time')
      .eq('user_id', session.user_id)
      .eq('status', 'finished')
      .not('validated_score', 'is', null)

    const todayTotalValidatedScore = (todaySessions || [])
      .filter(s => {
        const sessionDate = new Date(s.start_time)
        const todayStart = new Date(`${today}T00:00:00+07:00`)
        return sessionDate >= todayStart
      })
      .reduce((sum, s) => sum + (s.validated_score || 0), 0)

    // Get config snapshot from session or fallback to current config
    const configSnapshot = session.config_snapshot as GameConfigSnapshot ||
      (await getGameConfig()).gameMechanics

    // Validate score using server-side logic
    const validationResult = validateScore(
      clientScore,
      durationSeconds,
      configSnapshot,
      todayTotalValidatedScore
    )

    const { validatedScore, suspicionReason } = validationResult

    // Log suspicious activity
    if (suspicionReason) {
      console.warn(`[ANTI-CHEAT] Suspicious: ${suspicionReason} (User: ${payload.userId}, Token: ${gameToken.substring(0, 8)}...)`)
    }

    // Update session - mark as finished
    const { error: updateError } = await supabaseAdmin
      .from('game_sessions')
      .update({
        status: 'finished',
        end_time: now.toISOString(),
        client_score: clientScore,
        client_duration_seconds: Math.round(durationSeconds),
        validated_score: validatedScore,
        suspicion_reason: suspicionReason
      })
      .eq('id', session.id)

    if (updateError) {
      console.error('[GAME END] Failed to update session:', updateError)
      return NextResponse.json(
        { error: 'Không thể cập nhật phiên chơi' },
        { status: 500 }
      )
    }

    // Get user for score update
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

    // Update user's total score with VALIDATED score (not client score)
    const newTotalScore = user.total_score + validatedScore
    const { error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update({
        total_score: newTotalScore
      })
      .eq('id', user.id)

    if (userUpdateError) {
      console.error('[GAME END] CRITICAL: Failed to update user score:', userUpdateError)
      return NextResponse.json(
        { error: 'Không thể cập nhật điểm số' },
        { status: 500 }
      )
    }

    // Get active campaign
    const nowIso = new Date().toISOString()
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('is_active', true)
      .lte('start_date', nowIso)
      .gte('end_date', nowIso)
      .limit(1)

    // Update campaign_id if active
    if (campaign && campaign.length > 0) {
      await supabaseAdmin
        .from('game_sessions')
        .update({ campaign_id: campaign[0].id })
        .eq('id', session.id)
    }

    // Check for referral reward (first game completed by referred user)
    const { data: referral } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', user.id)
      .eq('reward_given', false)
      .single()

    if (referral) {
      const config = await getGameConfig()

      // Give bonus play to referrer
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

    // Return validated score to client
    // Client can show validated_score on scoreboard
    // Don't tell client if they were flagged - just show the validated score
    return NextResponse.json({
      success: true,
      score: validatedScore, // Return validated score (not client score)
      totalScore: newTotalScore,
      availableVouchers,
      // Debug info (có thể bỏ trong production)
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          clientScore,
          validatedScore,
          durationSeconds: Math.round(durationSeconds),
          suspicionReason
        }
      })
    })

  } catch (error) {
    console.error('End game error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
