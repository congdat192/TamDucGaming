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

    // Check for too many open sessions (prevent session hoarding)
    const { count: openSessionCount, error: openSessionError } = await supabaseAdmin
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', payload.userId)
      .eq('status', 'started')

    if (openSessionError) {
      console.error('[GAME START] Error checking open sessions:', openSessionError)
    }

    if (openSessionCount && openSessionCount >= MAX_OPEN_SESSIONS) {
      console.warn(`[ANTI-CHEAT] User ${payload.userId} has ${openSessionCount} open sessions (max: ${MAX_OPEN_SESSIONS})`)

      // Auto-invalidate oldest open sessions to allow new game
      const { data: oldSessions } = await supabaseAdmin
        .from('game_sessions')
        .select('id')
        .eq('user_id', payload.userId)
        .eq('status', 'started')
        .order('start_time', { ascending: true })
        .limit(openSessionCount - MAX_OPEN_SESSIONS + 1)

      if (oldSessions && oldSessions.length > 0) {
        await supabaseAdmin
          .from('game_sessions')
          .update({
            status: 'invalid',
            suspicion_reason: 'Session expired - too many open sessions'
          })
          .in('id', oldSessions.map(s => s.id))

        console.log(`[ANTI-CHEAT] Invalidated ${oldSessions.length} old sessions for user ${payload.userId}`)
      }
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

    if (user.last_play_date !== today) {
      playsToday = 0
      await supabaseAdmin
        .from('users')
        .update({
          plays_today: 0,
          last_play_date: today
        })
        .eq('id', user.id)
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
    if (!isTest) {
      if (freePlaysRemaining > 0) {
        await supabaseAdmin
          .from('users')
          .update({
            plays_today: playsToday + 1,
            last_play_date: today
          })
          .eq('id', user.id)
      } else {
        await supabaseAdmin
          .from('users')
          .update({
            bonus_plays: bonusPlays - 1
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
