import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getGameConfig } from '@/lib/gameConfig'
import { VOUCHER_TIERS } from '@/lib/voucher'
import { notifyCanRedeemVoucher } from '@/lib/notifications'
import { rateLimit } from '@/lib/ratelimit'
import {
  validateScore,
  type GameConfigSnapshot,
  VALIDATION_CONSTANTS
} from '@/lib/game/validateScore'
import { getVietnamDate } from '@/lib/date'

import { verifyHMAC } from '@/lib/crypto'

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

    // Parse request body - client gửi gameToken, score, duration, signature, và _h (honeypot)
    const { gameToken, score, duration: clientDuration, signature, _h: honeypotValue } = await request.json()

    // 🍯 HONEYPOT: Check if honeypot was triggered
    if (honeypotValue !== undefined && honeypotValue !== 0) {
      console.error(`[HONEYPOT] User ${payload.userId} triggered honeypot with value: ${honeypotValue}`)

      // Mark session as invalid
      if (gameToken) {
        await supabaseAdmin
          .from('game_sessions')
          .update({
            status: 'invalid',
            suspicion_reason: `HONEYPOT TRIGGERED - Attempted to modify fake score variables: ${honeypotValue}`
          })
          .eq('game_token', gameToken)
      }

      // Ban user (optional - can be uncommented if needed)
      // await supabaseAdmin
      //   .from('users')
      //   .update({
      //     is_banned: true,
      //     ban_reason: 'Honeypot triggered - script/hack detected'
      //   })
      //   .eq('id', payload.userId)

      return NextResponse.json(
        {
          error: 'Phát hiện hành vi gian lận. Phiên chơi đã bị vô hiệu hóa.',
          errorCode: 'HONEYPOT_TRIGGERED'
        },
        { status: 403 }
      )
    }

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

    // 🔐 PAYLOAD SIGNING: Verify HMAC signature
    if (signature && session.challenge && clientDuration !== undefined) {
      // Reconstruct payload: gameToken|score|duration
      const payloadString = `${gameToken}|${clientScore}|${clientDuration}`

      // Verify signature using challenge as key
      const isValid = verifyHMAC(payloadString, session.challenge, signature)

      if (!isValid) {
        console.error(`[PAYLOAD SIGNING] Invalid signature for user ${session.user_id}, session ${gameToken}`)

        // Mark session as invalid
        await supabaseAdmin
          .from('game_sessions')
          .update({
            status: 'invalid',
            suspicion_reason: 'PAYLOAD SIGNING FAILED - Request signature verification failed'
          })
          .eq('game_token', gameToken)

        return NextResponse.json(
          {
            error: 'Phát hiện hành vi gian lận. Chữ ký không hợp lệ.',
            errorCode: 'SIGNATURE_VERIFICATION_FAILED'
          },
          { status: 403 }
        )
      }

      console.log(`[PAYLOAD SIGNING] Signature verified successfully for session ${gameToken.substring(0, 8)}...`)
    } else if (session.challenge) {
      // Challenge exists but signature missing → suspicious
      console.warn(`[PAYLOAD SIGNING] Missing signature for session ${gameToken} (challenge exists)`)

      // Mark as suspicious but don't block (for backwards compatibility)
      await supabaseAdmin
        .from('game_sessions')
        .update({
          suspicion_reason: 'PAYLOAD SIGNING - Missing signature (possible old client)'
        })
        .eq('game_token', gameToken)
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

    // Calculate remaining plays for client to display immediately
    const config = await getGameConfig()
    const playsRemaining = Math.max(0, config.maxPlaysPerDay - user.plays_today) + user.bonus_plays

    // Return validated score to client
    // Client can show validated_score on scoreboard
    // Don't tell client if they were flagged - just show the validated score
    return NextResponse.json({
      success: true,
      score: validatedScore, // Return validated score (not client score)
      totalScore: newTotalScore,
      playsRemaining, // ✅ Return updated plays remaining
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
