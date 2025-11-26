import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'santa-jump-secret'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const { email, otp } = await request.json()

        if (!email || !otp) {
            return NextResponse.json(
                { error: 'Thiếu thông tin' },
                { status: 400 }
            )
        }

        // Verify OTP
        const { data: otpRecord, error: otpError } = await supabaseAdmin
            .from('otp_codes')
            .select('*')
            .eq('email', email)
            .eq('code', otp)
            .eq('verified', false)
            .gt('expires_at', new Date().toISOString())
            .single()

        if (otpError || !otpRecord) {
            return NextResponse.json(
                { error: 'Mã OTP không đúng hoặc đã hết hạn' },
                { status: 400 }
            )
        }

        // Mark OTP as verified
        await supabaseAdmin
            .from('otp_codes')
            .update({ verified: true })
            .eq('id', otpRecord.id)

        // Get admin info
        const { data: admin, error: adminError } = await supabaseAdmin
            .from('admins')
            .select('*')
            .eq('email', email)
            .single()

        if (adminError || !admin) {
            return NextResponse.json(
                { error: 'Không tìm thấy thông tin admin' },
                { status: 404 }
            )
        }

        // Generate JWT Token
        const token = jwt.sign(
            {
                adminId: admin.id,
                username: admin.username,
                email: admin.email,
                isAdmin: true
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        )

        // Set Cookie
        const cookieStore = await cookies()
        cookieStore.set('admin-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/'
        })

        // Log successful login
        await supabaseAdmin.from('admin_login_logs').insert({
            admin_id: admin.id,
            username: admin.username,
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
            success: true,
            method: 'otp_email'
        })

        return NextResponse.json({
            success: true,
            admin: {
                id: admin.id,
                username: admin.username,
                email: admin.email
            }
        })

    } catch (error) {
        console.error('Admin verify OTP error:', error)
        return NextResponse.json(
            { error: 'Đã xảy ra lỗi. Vui lòng thử lại.' },
            { status: 500 }
        )
    }
}
