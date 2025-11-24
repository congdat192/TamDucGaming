import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  notifyVoucherExpiring,
  notifyInactiveReminder,
  notifyTopRanking
} from '@/lib/notifications'

// Cron job này sẽ được gọi hàng ngày bởi Vercel Cron
// Hoặc có thể gọi thủ công với secret key

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  try {
    // Verify request (Vercel Cron hoặc manual call với secret)
    const authHeader = request.headers.get('authorization')
    const isVercelCron = request.headers.get('x-vercel-cron') === '1'

    // Allow if: Vercel Cron OR valid CRON_SECRET
    if (!isVercelCron && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = {
      voucherExpiring: 0,
      inactiveReminder: 0,
      topRanking: 0,
      errors: [] as string[]
    }

    // 1. Voucher sắp hết hạn (còn 3 ngày)
    try {
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

      const twoDaysFromNow = new Date()
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)

      const { data: expiringVouchers } = await supabaseAdmin
        .from('vouchers')
        .select('id, user_id, code, value, expires_at')
        .eq('is_used', false)
        .gte('expires_at', twoDaysFromNow.toISOString())
        .lte('expires_at', threeDaysFromNow.toISOString())

      if (expiringVouchers) {
        for (const voucher of expiringVouchers) {
          // Check if already notified (prevent duplicate)
          const { data: existingNotif } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('user_id', voucher.user_id)
            .eq('type', 'voucher_expiring')
            .eq('data->voucherCode', voucher.code)
            .single()

          if (!existingNotif) {
            const daysLeft = Math.ceil(
              (new Date(voucher.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
            await notifyVoucherExpiring(voucher.user_id, voucher.code, voucher.value, daysLeft)
            results.voucherExpiring++
          }
        }
      }
    } catch (error) {
      results.errors.push(`Voucher expiring error: ${error}`)
    }

    // 2. Nhắc nhở người dùng không hoạt động (3 ngày không chơi)
    try {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

      // Tìm users có bonus_plays > 0 và không chơi trong 3 ngày
      const { data: inactiveUsers } = await supabaseAdmin
        .from('users')
        .select('id, bonus_plays, last_play_date')
        .gt('bonus_plays', 0)
        .lt('last_play_date', threeDaysAgo.toISOString().split('T')[0])

      if (inactiveUsers) {
        for (const user of inactiveUsers) {
          // Check if already notified today
          const today = new Date().toISOString().split('T')[0]
          const { data: existingNotif } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', 'inactive_reminder')
            .gte('created_at', today)
            .single()

          if (!existingNotif) {
            const daysInactive = Math.ceil(
              (Date.now() - new Date(user.last_play_date).getTime()) / (1000 * 60 * 60 * 24)
            )
            await notifyInactiveReminder(user.id, daysInactive, user.bonus_plays)
            results.inactiveReminder++
          }
        }
      }
    } catch (error) {
      results.errors.push(`Inactive reminder error: ${error}`)
    }

    // 3. Chúc mừng TOP 10 tuần/tháng
    try {
      // Weekly TOP 10
      const { data: weeklyTop } = await supabaseAdmin
        .from('leaderboard_weekly')
        .select('id')
        .limit(10)

      if (weeklyTop) {
        for (let i = 0; i < weeklyTop.length; i++) {
          const userId = weeklyTop[i].id
          const rank = i + 1

          // Only notify TOP 1, 2, 3
          if (rank <= 3) {
            // Check if already notified this week
            const weekStart = getWeekStart()
            const { data: existingNotif } = await supabaseAdmin
              .from('notifications')
              .select('id')
              .eq('user_id', userId)
              .eq('type', 'top_ranking')
              .eq('data->period', 'weekly')
              .gte('created_at', weekStart.toISOString())
              .single()

            if (!existingNotif) {
              await notifyTopRanking(userId, rank, 'weekly')
              results.topRanking++
            }
          }
        }
      }

      // Monthly TOP 10 (chỉ notify vào ngày cuối tháng hoặc ngày 1)
      const today = new Date()
      const isEndOfMonth = today.getDate() === new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
      const isFirstOfMonth = today.getDate() === 1

      if (isEndOfMonth || isFirstOfMonth) {
        const { data: monthlyTop } = await supabaseAdmin
          .from('leaderboard_monthly')
          .select('id')
          .limit(10)

        if (monthlyTop) {
          for (let i = 0; i < Math.min(3, monthlyTop.length); i++) {
            const userId = monthlyTop[i].id
            const rank = i + 1

            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
            const { data: existingNotif } = await supabaseAdmin
              .from('notifications')
              .select('id')
              .eq('user_id', userId)
              .eq('type', 'top_ranking')
              .eq('data->period', 'monthly')
              .gte('created_at', monthStart.toISOString())
              .single()

            if (!existingNotif) {
              await notifyTopRanking(userId, rank, 'monthly')
              results.topRanking++
            }
          }
        }
      }
    } catch (error) {
      results.errors.push(`Top ranking error: ${error}`)
    }

    // 4. Cleanup old notifications (older than 30 days)
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      await supabaseAdmin
        .from('notifications')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())
    } catch (error) {
      results.errors.push(`Cleanup error: ${error}`)
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[CRON] Notifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper: Get start of current week (Monday)
function getWeekStart(): Date {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  return new Date(now.setDate(diff))
}
