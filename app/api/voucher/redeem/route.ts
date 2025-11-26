import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, generateVoucherCode } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { VOUCHER_TIERS } from '@/lib/voucher'
import { notifyVoucherClaimed } from '@/lib/notifications'
import { getEmailTemplates } from '@/lib/emailTemplates'

export const dynamic = 'force-dynamic'

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

        const { minScore } = await request.json()

        if (typeof minScore !== 'number' || minScore <= 0) {
            return NextResponse.json(
                { error: 'Voucher không hợp lệ' },
                { status: 400 }
            )
        }

        // Get user
        const { data: user, error: userError } = await supabase
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

        // Find voucher tier
        const voucherTier = VOUCHER_TIERS.find(v => v.minScore === minScore)
        if (!voucherTier) {
            return NextResponse.json(
                { error: 'Voucher không tồn tại' },
                { status: 404 }
            )
        }

        // Check if user has enough points
        if (user.total_score < voucherTier.minScore) {
            return NextResponse.json(
                { error: 'Không đủ điểm để đổi voucher này' },
                { status: 400 }
            )
        }

        // Deduct points and create voucher
        const newTotalScore = user.total_score - voucherTier.minScore

        // Update user's total score
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                total_score: newTotalScore
            })
            .eq('id', user.id)

        if (updateError) {
            console.error('[VOUCHER REDEEM] Failed to update user score:', updateError)
            return NextResponse.json(
                { error: 'Không thể trừ điểm' },
                { status: 500 }
            )
        }

        // Create voucher
        const voucherCode = generateVoucherCode()
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1) // Voucher valid for 1 month

        const { data: newVoucher, error: voucherError } = await supabaseAdmin
            .from('vouchers')
            .insert({
                user_id: user.id,
                code: voucherCode,
                value: voucherTier.value,
                score_earned: voucherTier.minScore, // Points used to redeem
                expires_at: expiresAt.toISOString()
            })
            .select()
            .single()

        if (voucherError || !newVoucher) {
            console.error('[VOUCHER REDEEM] Failed to create voucher:', voucherError)

            // Rollback: restore user's points
            await supabaseAdmin
                .from('users')
                .update({
                    total_score: user.total_score
                })
                .eq('id', user.id)

            return NextResponse.json(
                { error: 'Không thể tạo voucher' },
                { status: 500 }
            )
        }

        // Send in-app notification
        try {
            await notifyVoucherClaimed(user.id, voucherTier.value, voucherCode)
            console.log(`[VOUCHER NOTIFICATION] Created for ${user.id}`)
        } catch (notifyError) {
            console.error('[VOUCHER NOTIFICATION] Failed:', notifyError)
        }

        // Send voucher to user's email automatically
        // Send voucher to user's email automatically
        if (user.email) {
            try {
                // Dynamic import to ensure env vars are loaded if needed (though nextjs handles this)
                const { sendVoucherEmail } = await import('@/lib/email')

                const expiresAtFormatted = new Date(newVoucher.expires_at).toLocaleDateString('vi-VN')
                const voucherLabel = voucherTier.label

                await sendVoucherEmail(user.email, voucherLabel, voucherCode, expiresAtFormatted)
                console.log(`[VOUCHER EMAIL] Sent to ${user.email}`)
            } catch (emailError) {
                console.error('[VOUCHER EMAIL] Failed to send:', emailError)
                // Don't fail the request if email fails
            }
        } else {
            console.log(`[VOUCHER API] User has no email, skipping.`)
        }

        return NextResponse.json({
            success: true,
            voucher: {
                code: voucherCode,
                value: voucherTier.value,
                label: voucherTier.label
            },
            newTotalScore,
            emailSent: !!user.email
        })

    } catch (error) {
        console.error('Redeem voucher error:', error)
        return NextResponse.json(
            { error: 'Đã xảy ra lỗi' },
            { status: 500 }
        )
    }
}
