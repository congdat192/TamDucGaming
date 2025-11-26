import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, generateGameToken } from '@/lib/auth'
import { getGameConfig, isTestAccount } from '@/lib/gameConfig'
import { getVietnamDate } from '@/lib/date'

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
      const { count, error: countError } = await supabase
        .from('game_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('played_at', `${today}T00:00:00+07:00`)

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

    // Generate Game Token
    const sessionId = crypto.randomUUID()
    const gameToken = generateGameToken({
      sessionId,
      userId: user.id,
      startTime: Date.now()
    })

    return NextResponse.json({
      success: true,
      playsRemaining: isTest ? 999 : totalPlaysRemaining - 1,
      gameToken,
      sessionId
    })

  } catch (error) {
    console.error('Start game error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
