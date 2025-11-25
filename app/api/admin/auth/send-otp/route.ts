import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateOTP } from '@/lib/auth'
import { sendOtpEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json()

        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { error: 'Email không hợp lệ' },
                { status: 400 }
            )
        }

        // Check if email belongs to an admin
        const { data: admin, error: adminError } = await supabaseAdmin
            .from('admins')
            .select('id')
            .eq('email', email)
            .single()

        if (adminError || !admin) {
            // Security: Don't reveal if email exists or not, just fake success or generic error
            // But for admin panel, we might want to be explicit or just say "If email is valid, OTP sent"
            console.log(`[ADMIN LOGIN] Attempt with non-admin email: ${email}`)
            return NextResponse.json(
                { error: 'Email không có quyền truy cập' },
                { status: 403 }
            )
        }

        // Generate OTP
        const otp = generateOTP(email)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

        // Delete old OTP codes for this email
        await supabaseAdmin
            .from('otp_codes')
            .delete()
            .eq('email', email)

        // Store OTP in database
        const { error: otpError } = await supabaseAdmin
            .from('otp_codes')
            .insert({
                email: email,
                code: otp,
                expires_at: expiresAt.toISOString(),
                verified: false
            })

        if (otpError) {
            console.error('Failed to store OTP:', otpError)
            return NextResponse.json(
                { error: 'Không thể gửi OTP. Vui lòng thử lại.' },
                { status: 500 }
            )
        }

        // Send OTP via email
        const sent = await sendOtpEmail(email, otp)

        if (sent) {
            console.log(`[ADMIN OTP] Sent to: ${email}`)
        } else {
            console.log(`[ADMIN OTP] Failed to send to: ${email}, OTP: ${otp}`)
            return NextResponse.json(
                { error: 'Không thể gửi email OTP. Vui lòng kiểm tra lại hệ thống email.' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'OTP đã được gửi qua email',
            // Debug OTP in dev mode
            ...(process.env.MOCK_OTP_ENABLED === 'true' && { debug_otp: otp })
        })

    } catch (error) {
        console.error('Admin send OTP error:', error)
        return NextResponse.json(
            { error: 'Đã xảy ra lỗi. Vui lòng thử lại.' },
            { status: 500 }
        )
    }
}
