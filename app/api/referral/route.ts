import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

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

    // Get user's referral info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, referral_code, bonus_plays')
      .eq('id', payload.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    // Get referral stats
    const { data: referrals, error: refError } = await supabase
      .from('referrals')
      .select('id, reward_given, created_at')
      .eq('referrer_id', user.id)

    const totalReferrals = referrals?.length || 0
    const successfulReferrals = referrals?.filter(r => r.reward_given).length || 0

    const referralLink = `${process.env.NEXT_PUBLIC_BASE_URL}?ref=${user.referral_code}`

    return NextResponse.json({
      referralCode: user.referral_code,
      referralLink,
      totalReferrals,
      successfulReferrals,
      bonusPlays: user.bonus_plays
    })

  } catch (error) {
    console.error('Get referral error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
