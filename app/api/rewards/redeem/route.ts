import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, generateVoucherCode } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

    const { rewardId } = await request.json()

    if (!rewardId) {
      return NextResponse.json(
        { error: 'Thiếu thông tin quà tặng' },
        { status: 400 }
      )
    }

    // Get user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    // Get reward
    const { data: reward, error: rewardError } = await supabaseAdmin
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .eq('is_active', true)
      .single()

    if (rewardError || !reward) {
      return NextResponse.json(
        { error: 'Không tìm thấy quà tặng' },
        { status: 404 }
      )
    }

    // Check if user has enough points
    if (user.total_score < reward.points_required) {
      return NextResponse.json(
        { error: `Bạn cần ${reward.points_required - user.total_score} điểm nữa` },
        { status: 400 }
      )
    }

    // Check stock
    if (reward.stock <= 0) {
      return NextResponse.json(
        { error: 'Quà tặng đã hết' },
        { status: 400 }
      )
    }

    // Generate code for voucher type
    const code = reward.type === 'voucher' ? generateVoucherCode() : null

    // Create redemption record
    const { error: redemptionError } = await supabaseAdmin
      .from('reward_redemptions')
      .insert({
        user_id: user.id,
        reward_id: reward.id,
        points_used: reward.points_required,
        code,
        status: reward.type === 'voucher' ? 'completed' : 'pending'
      })

    if (redemptionError) {
      console.error('Redemption error:', redemptionError)
      return NextResponse.json(
        { error: 'Không thể đổi quà' },
        { status: 500 }
      )
    }

    // Deduct points from user
    const { error: updateUserError } = await supabaseAdmin
      .from('users')
      .update({
        total_score: user.total_score - reward.points_required
      })
      .eq('id', user.id)

    if (updateUserError) {
      console.error('Update user points error:', updateUserError)
    }

    // Decrease stock
    const { error: updateStockError } = await supabaseAdmin
      .from('rewards')
      .update({
        stock: reward.stock - 1
      })
      .eq('id', reward.id)

    if (updateStockError) {
      console.error('Update stock error:', updateStockError)
    }

    // Send email for voucher redemption
    if (reward.type === 'voucher' && user.email) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        const { getEmailTemplates } = await import('@/lib/emailTemplates')
        const templates = await getEmailTemplates()
        const emailTemplate = templates.voucherClaim

        // Calculate expiry date (30 days from now)
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 30)
        const formattedExpiry = expiryDate.toLocaleDateString('vi-VN')

        const html = emailTemplate.htmlTemplate
          .replace(/{{voucherLabel}}/g, reward.name)
          .replace(/{{voucherCode}}/g, code || '')
          .replace(/{{expiresAt}}/g, formattedExpiry)

        const subject = emailTemplate.subject
          .replace('{{voucherLabel}}', reward.name)

        await resend.emails.send({
          from: `${emailTemplate.fromName} <${emailTemplate.fromEmail}>`,
          to: user.email,
          subject,
          html
        })

        console.log(`[VOUCHER EMAIL] Sent to ${user.email}`)
      } catch (emailError) {
        console.error('Failed to send voucher email:', emailError)
        // Don't fail the redemption if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: reward.type === 'voucher'
        ? `Đổi thành công! Mã voucher đã được gửi qua email: ${user.email || 'email của bạn'}`
        : 'Đổi thành công! Chúng tôi sẽ liên hệ bạn để giao quà.',
      code,
      reward: {
        name: reward.name,
        type: reward.type,
        value: reward.value
      }
    })

  } catch (error) {
    console.error('Redeem reward error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
