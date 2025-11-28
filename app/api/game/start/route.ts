import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken } from '@/lib/auth'
import { getGameConfig, isTestAccount } from '@/lib/gameConfig'
import { getVietnamDate } from '@/lib/date'
import { hashClientInfo, type GameConfigSnapshot } from '@/lib/game/validateScore'
import { rateLimit } from '@/lib/ratelimit'
import { isDesktopBrowser, isDesktopWhitelisted } from '@/lib/userAgent'

export const dynamic = 'force-dynamic'

// Constants
const MAX_OPEN_SESSIONS = 3 // Max sessions in 'started' status per user

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

    // 🚫 ANTI-CHEAT: Block desktop browsers (mobile-only game)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    if (isDesktopBrowser(userAgent)) {
      // Check if user is in whitelist (admins can test on desktop)
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', payload.userId)
        .single()

      if (!user || !isDesktopWhitelisted(user.email)) {
        console.warn(`[ANTI-CHEAT] Desktop browser blocked for user ${payload.userId}`)
        return NextResponse.json(
          {
            error: 'Game chỉ hỗ trợ trên điện thoại di động. Vui lòng mở bằng trình duyệt trên điện thoại.',
            errorCode: 'DESKTOP_NOT_ALLOWED'
          },
          { status: 403 }
        )
      } else {
        console.log(`[ADMIN] Desktop access allowed for whitelisted user: ${user.email}`)
      }
    }

    // Rate limiting: 10 requests per minute per user
    const rateLimitResult = rateLimit(`game-start:${payload.userId}`, {
      maxRequests: 10,
      windowMs: 60 * 1000 // 1 minute
    })

    if (!rateLimitResult.success) {
      console.warn(`[RATE LIMIT] User ${payload.userId} exceeded game-start rate limit`)
      return NextResponse.json(
        { error: 'Bạn thao tác quá nhanh, vui lòng chờ 1 phút' },
        { status: 429 }
      )
    }


    // 🛡️ ANTI-DUPLICATE: Check for active session in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data: recentSessions, error: recentSessionError } = await supabaseAdmin
      .from('game_sessions')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('status', 'started')
      .gte('start_time', fiveMinutesAgo)
      .order('start_time', { ascending: false })
      .limit(1)

    if (recentSessionError) {
      console.error('[GAME START] Error checking recent sessions:', recentSessionError)
    }

    // If user has an active session in last 5 minutes, reject new game start
    if (recentSessions && recentSessions.length > 0) {
      const activeSession = recentSessions[0]
      console.warn(`[ANTI-DUPLICATE] User ${payload.userId} has active session from ${activeSession.start_time}`)
      return NextResponse.json(
        {
          error: 'Bạn đang có game đang chơi. Vui lòng hoàn thành game trước.',
          errorCode: 'GAME_IN_PROGRESS'
        },
        { status: 400 }
      )
    }

    // 🧹 CLEANUP: Auto-invalidate stale sessions (>5 minutes old, never played)
    const { data: staleSessions } = await supabaseAdmin
      .from('game_sessions')
      .select('id, start_time')
      .eq('user_id', payload.userId)
      .eq('status', 'started')
      .lt('start_time', fiveMinutesAgo)

    if (staleSessions && staleSessions.length > 0) {
      await supabaseAdmin
        .from('game_sessions')
        .update({
          status: 'invalid',
          suspicion_reason: 'Session timeout - never played (>5 minutes)'
        })
        .in('id', staleSessions.map(s => s.id))

      console.log(`[CLEANUP] Invalidated ${staleSessions.length} stale sessions for user ${payload.userId}`)
    }

    // Get config from database
    const config = await getGameConfig()

    // Get user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    // Test account - unlimited plays
    const isTest = isTestAccount(config, user.email, user.phone)

    // Hard limit: Maximum games per day (prevent spam/hack)
    const MAX_GAMES_PER_DAY = 50
    if (!isTest) {
      const today = getVietnamDate()
      const { count, error: countError } = await supabaseAdmin
        .from('game_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('start_time', `${today}T00:00:00+07:00`)

      if (countError) {
        console.error('[GAME START] Error counting games:', countError)
      }

      if (count && count >= MAX_GAMES_PER_DAY) {
        console.warn(`[HARD LIMIT] User ${user.id} exceeded max games per day: ${count}`)
        return NextResponse.json(
          { error: `Đã đạt giới hạn tối đa ${MAX_GAMES_PER_DAY} game trong ngày` },
          { status: 400 }
        )
      }
    }

    // Check if today is a new day (Vietnam Time)
    const today = getVietnamDate()
    let playsToday = user.plays_today
    let bonusPlays = user.bonus_plays

    // Reset plays_today if it's a new day (will be handled in the single UPDATE below)
    if (user.last_play_date !== today) {
      playsToday = 0
    }

    // Check if user has plays remaining (using config from DB)
    const freePlaysRemaining = config.maxPlaysPerDay - playsToday
    const totalPlaysRemaining = freePlaysRemaining + bonusPlays

    if (!isTest && totalPlaysRemaining <= 0) {
      return NextResponse.json(
        { error: 'Bạn đã hết lượt chơi. Giới thiệu bạn bè để có thêm lượt!' },
        { status: 400 }
      )
    }

    // Consume a play (free plays first, then bonus plays) - SKIP FOR TEST ACCOUNTS
    // ATOMIC UPDATE: Handle both new day reset AND play consumption in ONE query
    if (!isTest) {
      if (freePlaysRemaining > 0) {
        // Consume a free play
        await supabaseAdmin
          .from('users')
          .update({
            plays_today: playsToday + 1,
            last_play_date: today
          })
          .eq('id', user.id)
      } else {
        // Consume a bonus play
        await supabaseAdmin
          .from('users')
          .update({
            bonus_plays: bonusPlays - 1,
            last_play_date: today
          })
          .eq('id', user.id)
      }
    }

    // Generate server-owned game token (UUID)
    const gameToken = crypto.randomUUID()

    // 🔐 PAYLOAD SIGNING: Generate challenge for HMAC verification
    const challenge = crypto.randomUUID()

    // Get client info for anti-cheat tracking
    const clientIp = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    // userAgent already declared above for desktop detection
    const ipHash = hashClientInfo(clientIp, userAgent)

    // Create config snapshot for validation later
    const configSnapshot: GameConfigSnapshot = {
      gravity: config.gameMechanics.gravity,
      jumpForce: config.gameMechanics.jumpForce,
      maxFallSpeed: config.gameMechanics.maxFallSpeed,
      obstacleWidth: config.gameMechanics.obstacleWidth,
      gapHeight: config.gameMechanics.gapHeight,
      obstacleSpeed: config.gameMechanics.obstacleSpeed,
      spawnInterval: config.gameMechanics.spawnInterval,
      speedIncrement: config.gameMechanics.speedIncrement,
      speedIncrementInterval: config.gameMechanics.speedIncrementInterval,
      maxSpeed: config.gameMechanics.maxSpeed,
      gapDecrease: config.gameMechanics.gapDecrease,
      minGap: config.gameMechanics.minGap,
      spawnIntervalDecrease: config.gameMechanics.spawnIntervalDecrease,
      minSpawnInterval: config.gameMechanics.minSpawnInterval
    }

    // Insert game session into database (server-owned)
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('game_sessions')
      .insert({
        user_id: user.id,
        game_token: gameToken,
        challenge: challenge, // For HMAC payload signing
        status: 'started',
        start_time: new Date().toISOString(),
        config_snapshot: configSnapshot,
        ip_hash: ipHash,
        user_agent: userAgent.substring(0, 500) // Limit length
      })
      .select()
      .single()

    if (sessionError) {
      console.error('[GAME START] Failed to create session:', sessionError)
      return NextResponse.json(
        { error: 'Không thể tạo phiên chơi' },
        { status: 500 }
      )
    }

    // Return response with server time for client sync
    return NextResponse.json({
      success: true,
      playsRemaining: isTest ? 999 : totalPlaysRemaining - 1,
      gameToken,
      challenge, // Send challenge for HMAC payload signing
      serverTime: new Date().toISOString(),
      config: config.gameMechanics // Send game config to client
    })

  } catch (error) {
    console.error('Start game error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
