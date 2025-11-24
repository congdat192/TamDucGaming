import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'santa-jump-secret'

// Admin credentials từ environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Thiếu thông tin' },
        { status: 400 }
      )
    }

    // Verify admin credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { adminId: 'admin', username: ADMIN_USERNAME, isAdmin: true },
        JWT_SECRET,
        { expiresIn: '24h' }
      )

      // Set HTTP-only cookie
      const cookieStore = await cookies()
      cookieStore.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/'
      })

      return NextResponse.json({
        success: true,
        admin: { username: ADMIN_USERNAME }
      })
    }

    return NextResponse.json(
      { error: 'Sai tài khoản hoặc mật khẩu' },
      { status: 401 }
    )

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
