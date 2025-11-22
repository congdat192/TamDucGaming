import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getGameConfig, isTestAccount } from '@/lib/gameConfig'

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
    if (isTestAccount(config, user.email, user.phone)) {
      return NextResponse.json({
        success: true,
        playsRemaining: 999
      })
    }

    // Check if today is a new day
    const today = new Date().toISOString().split('T')[0]
    let playsToday = user.plays_today
    let bonusPlays = user.bonus_plays

    if (user.last_play_date !== today) {
      playsToday = 0
      await supabase
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

    if (totalPlaysRemaining <= 0) {
      return NextResponse.json(
        { error: 'Bạn đã hết lượt chơi. Giới thiệu bạn bè để có thêm lượt!' },
        { status: 400 }
      )
    }

    // Consume a play (free plays first, then bonus plays)
    if (freePlaysRemaining > 0) {
      await supabase
        .from('users')
        .update({
          plays_today: playsToday + 1,
          last_play_date: today
        })
        .eq('id', user.id)
    } else {
      await supabase
        .from('users')
        .update({
          bonus_plays: bonusPlays - 1
        })
        .eq('id', user.id)
    }

    return NextResponse.json({
      success: true,
      playsRemaining: totalPlaysRemaining - 1
    })

  } catch (error) {
    console.error('Start game error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
