import { supabaseAdmin } from './supabase-admin'

export type NotificationType =
  | 'referral_bonus'      // Khi người được mời hoàn thành game đầu tiên
  | 'points_reminder'     // Nhắc nhở có điểm có thể đổi voucher
  | 'voucher_available'   // Khi đổi voucher thành công
  | 'voucher_expiring'    // Voucher sắp hết hạn
  | 'daily_bonus'         // Cộng lượt chơi hàng ngày
  | 'welcome'             // Chào mừng người dùng mới
  | 'inactive_reminder'   // Nhắc nhở khi không chơi lâu
  | 'top_ranking'         // Chúc mừng lên TOP
  | 'system'              // Thông báo hệ thống
  | 'admin_broadcast'     // Admin gửi thông báo

export interface NotificationData {
  bonusPlays?: number
  points?: number
  voucherValue?: number
  voucherCode?: string
  link?: string
  [key: string]: unknown
}

export interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: NotificationData
}

// Tạo notification cho 1 user
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, data = {} } = params

  const { data: notification, error } = await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      data,
      is_read: false
    })
    .select()
    .single()

  if (error) {
    console.error('[NOTIFICATION] Failed to create:', error)
    return null
  }

  return notification
}

// Tạo notification cho nhiều users (broadcast)
export async function createBroadcastNotification(
  userIds: string[],
  title: string,
  message: string,
  data: NotificationData = {}
) {
  const notifications = userIds.map(userId => ({
    user_id: userId,
    type: 'admin_broadcast' as NotificationType,
    title,
    message,
    data,
    is_read: false
  }))

  const { data: result, error } = await supabaseAdmin
    .from('notifications')
    .insert(notifications)
    .select()

  if (error) {
    console.error('[NOTIFICATION] Failed to broadcast:', error)
    return null
  }

  return result
}

// Lấy notifications của user
export async function getUserNotifications(userId: string, limit = 20) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[NOTIFICATION] Failed to get:', error)
    return []
  }

  return data
}

// Đếm số notification chưa đọc
export async function getUnreadCount(userId: string) {
  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('[NOTIFICATION] Failed to count:', error)
    return 0
  }

  return count || 0
}

// Đánh dấu đã đọc
export async function markAsRead(notificationId: string, userId: string) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)

  return !error
}

// Đánh dấu tất cả đã đọc
export async function markAllAsRead(userId: string) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  return !error
}

// === NOTIFICATION TEMPLATES ===

// Notification khi referrer nhận bonus plays
export async function notifyReferralBonus(referrerId: string, bonusPlays: number) {
  return createNotification({
    userId: referrerId,
    type: 'referral_bonus',
    title: 'Bạn nhận được lượt chơi mới!',
    message: `Bạn bè của bạn đã tham gia và hoàn thành lượt chơi đầu tiên. Bạn được +${bonusPlays} lượt chơi!`,
    data: { bonusPlays }
  })
}

// Notification khi đổi voucher thành công
export async function notifyVoucherClaimed(userId: string, voucherValue: number, voucherCode: string) {
  return createNotification({
    userId,
    type: 'voucher_available',
    title: 'Bạn đã đổi voucher thành công!',
    message: `Chúc mừng! Bạn đã đổi được voucher ${voucherValue.toLocaleString('vi-VN')}đ. Mã: ${voucherCode}`,
    data: { voucherValue, voucherCode, link: '/voucher' }
  })
}

// Notification nhắc nhở điểm có thể đổi voucher
export async function notifyPointsReminder(userId: string, points: number, suggestedVoucher: number) {
  return createNotification({
    userId,
    type: 'points_reminder',
    title: 'Bạn có điểm chưa sử dụng!',
    message: `Bạn có ${points} điểm và có thể đổi voucher ${suggestedVoucher.toLocaleString('vi-VN')}đ. Đổi ngay!`,
    data: { points, voucherValue: suggestedVoucher, link: '/voucher' }
  })
}

// Notification chào mừng người dùng mới
export async function notifyWelcome(userId: string, dailyPlays: number) {
  return createNotification({
    userId,
    type: 'welcome',
    title: 'Chào mừng bạn đến với Santa Jump!',
    message: `Mỗi ngày bạn có ${dailyPlays} lượt chơi miễn phí. Mời bạn bè để nhận thêm lượt chơi nhé!`,
    data: { dailyPlays, link: '/referral' }
  })
}

// Notification cộng lượt chơi hàng ngày
export async function notifyDailyBonus(userId: string, dailyPlays: number) {
  return createNotification({
    userId,
    type: 'daily_bonus',
    title: 'Lượt chơi mới đã sẵn sàng!',
    message: `Bạn có ${dailyPlays} lượt chơi mới hôm nay. Chơi ngay để nhận voucher!`,
    data: { dailyPlays, link: '/game' }
  })
}

// Notification đủ điểm đổi voucher (sau khi chơi xong)
export async function notifyCanRedeemVoucher(userId: string, totalPoints: number, voucherValue: number) {
  return createNotification({
    userId,
    type: 'points_reminder',
    title: 'Bạn đủ điểm đổi voucher!',
    message: `Chúc mừng! Với ${totalPoints} điểm, bạn có thể đổi voucher ${voucherValue.toLocaleString('vi-VN')}đ ngay bây giờ!`,
    data: { points: totalPoints, voucherValue, link: '/voucher' }
  })
}

// Notification voucher sắp hết hạn
export async function notifyVoucherExpiring(userId: string, voucherCode: string, voucherValue: number, daysLeft: number) {
  return createNotification({
    userId,
    type: 'voucher_expiring',
    title: 'Voucher sắp hết hạn!',
    message: `Voucher ${voucherValue.toLocaleString('vi-VN')}đ (${voucherCode}) sẽ hết hạn sau ${daysLeft} ngày. Sử dụng ngay!`,
    data: { voucherCode, voucherValue, daysLeft, link: '/voucher' }
  })
}

// Notification nhắc nhở khi không chơi lâu
export async function notifyInactiveReminder(userId: string, daysInactive: number, bonusPlays: number) {
  return createNotification({
    userId,
    type: 'inactive_reminder',
    title: 'Bạn ơi, lâu rồi không thấy bạn!',
    message: `Đã ${daysInactive} ngày bạn chưa chơi. Bạn còn ${bonusPlays} lượt chơi bonus đang chờ!`,
    data: { daysInactive, bonusPlays, link: '/game' }
  })
}

// Notification chúc mừng lên TOP
export async function notifyTopRanking(userId: string, rank: number, period: 'weekly' | 'monthly') {
  const periodText = period === 'weekly' ? 'tuần' : 'tháng'
  return createNotification({
    userId,
    type: 'top_ranking',
    title: `Chúc mừng! Bạn đang TOP ${rank}!`,
    message: `Bạn hiện đang xếp hạng ${rank} trong bảng xếp hạng ${periodText}. Cố gắng giữ vững vị trí nhé!`,
    data: { rank, period, link: '/leaderboard' }
  })
}
