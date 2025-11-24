import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'santa-jump-secret'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập', isAdmin: false },
        { status: 401 }
      )
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string; username: string; isAdmin: boolean }
      
      if (!decoded.isAdmin) {
        return NextResponse.json(
          { error: 'Không có quyền admin', isAdmin: false },
          { status: 403 }
        )
      }

      return NextResponse.json({
        isAdmin: true,
        admin: {
          id: decoded.adminId,
          username: decoded.username
        }
      })
    } catch {
      return NextResponse.json(
        { error: 'Token không hợp lệ', isAdmin: false },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Admin verify error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi', isAdmin: false },
      { status: 500 }
    )
  }
}
