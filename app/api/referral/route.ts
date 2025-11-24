import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

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
    const { data: user, error: userError } = await supabaseAdmin
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

    // Get referral stats and history
    const { data: referrals, error: refError } = await supabaseAdmin
      .from('referrals')
      .select('id, reward_given, created_at, referred_id')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    const totalReferrals = referrals?.length || 0
    const successfulReferrals = referrals?.filter(r => r.reward_given).length || 0

    // Fetch referred users details manually to avoid join issues
    let history: any[] = []
    if (referrals && referrals.length > 0) {
      const referredIds = referrals.map(r => r.referred_id)
      const { data: referredUsers } = await supabaseAdmin
        .from('users')
        .select('id, phone')
        .in('id', referredIds)

      const userMap = new Map(referredUsers?.map(u => [u.id, u]) || [])

      history = referrals.map((ref: any) => {
        const referredUser = userMap.get(ref.referred_id)
        const phone = referredUser?.phone || ''
        const maskedPhone = phone.length > 6
          ? `${phone.substring(0, 3)}***${phone.substring(phone.length - 3)}`
          : '***'

        return {
          id: ref.id,
          phone: maskedPhone,
          date: ref.created_at,
          status: ref.reward_given ? 'success' : 'pending',
          reward: ref.reward_given ? '+5 lượt' : 'Chờ xác thực'
        }
      })
    }

    const referralLink = `${process.env.NEXT_PUBLIC_BASE_URL}?ref=${user.referral_code}`

    console.log('[REFERRAL API] User ID:', user.id)
    console.log('[REFERRAL API] Total referrals:', totalReferrals)
    console.log('[REFERRAL API] Successful referrals:', successfulReferrals)
    console.log('[REFERRAL API] History count:', history.length)
    console.log('[REFERRAL API] Referrals data:', referrals)

    return NextResponse.json({
      referralCode: user.referral_code,
      referralLink,
      totalReferrals,
      successfulReferrals,
      bonusPlays: user.bonus_plays,
      history
    })

  } catch (error) {
    console.error('Get referral error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
