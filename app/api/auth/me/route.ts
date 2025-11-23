import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getVietnamDate } from '@/lib/date'

export async function GET(request: NextRequest) {
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

    // Get user from database
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



    // Check if today is a new day (Vietnam Time), reset plays_today
    const today = getVietnamDate()
    if (user.last_play_date !== today) {
      await supabase
        .from('users')
        .update({
          plays_today: 0,
          last_play_date: today
        })
        .eq('id', user.id)

      user.plays_today = 0
    }

    // Get total referrals
    const { count: totalReferrals } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.id)

    // Get total games played
    const { count: totalGamesPlayed } = await supabase
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        referral_code: user.referral_code,
        plays_today: user.plays_today,
        bonus_plays: user.bonus_plays,
        total_score: user.total_score,
        total_referrals: totalReferrals || 0,
        total_games_played: totalGamesPlayed || 0
      }
    })

  } catch (error) {
    console.error('Get me error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
