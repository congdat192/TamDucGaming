import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'santa-jump-secret'

// Default modal content
const DEFAULT_CONTENT = {
  addPhoneModal: {
    title: 'Nhận thêm 3 lượt chơi',
    subtitle: 'Cập nhật số điện thoại của bạn để nhận thêm lượt chơi',
    buttonText: '🎁 CẬP NHẬT SỐ ĐIỆN THOẠI',
    icon: '🎮',
    badge: '+ 3 lượt chơi',
  },
  outOfPlaysModal: {
    title: 'Hết lượt chơi rồi!',
    subtitle: 'Đừng buồn, mời bạn bè chơi cùng để nhận ngay +5 lượt chơi miễn phí nhé!',
    buttonText: 'Mời bạn bè (+5 lượt)',
    icon: '😢',
  },
  gameOverModal: {
    title: 'GAME OVER',
    playAgainButton: 'CHƠI LẠI',
    shareButton: 'CHIA SẺ NHẬN +5 LƯỢT',
    homeButton: 'Về trang chủ',
    inviteButton: 'Mời bạn bè (+5 lượt)',
    voucherSectionTitle: 'Chúc mừng! Bạn đã nhận được voucher',
    progressLabels: {
      label50k: '50K',
      label100k: '100K',
      label150k: '150K',
    },
  },
}

// Verify admin token from HTTP-only cookie
async function verifyAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-token')?.value

    if (!token) return false

    const decoded = jwt.verify(token, JWT_SECRET) as { isAdmin?: boolean }
    return decoded.isAdmin === true
  } catch {
    return false
  }
}

export async function GET() {
  try {
    if (!await verifyAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from('modal_content')
      .select('content')
      .eq('id', 'main')
      .single()

    if (error || !data) {
      // Return defaults if not found
      return NextResponse.json({ content: DEFAULT_CONTENT })
    }

    // Merge with defaults to ensure all fields exist
    const content = { ...DEFAULT_CONTENT, ...data.content }
    return NextResponse.json({ content })
  } catch (error) {
    console.error('Get modal content error:', error)
    return NextResponse.json({ error: 'Failed to get content' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await verifyAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('modal_content')
      .upsert({
        id: 'main',
        content,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Save modal content error:', error)
      return NextResponse.json({ error: 'Lỗi lưu content: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Modal content đã được lưu' })
  } catch (error) {
    console.error('Save modal content error:', error)
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 })
  }
}
