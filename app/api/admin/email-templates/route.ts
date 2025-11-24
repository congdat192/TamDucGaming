import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'santa-jump-secret'

// Default email templates
const DEFAULT_TEMPLATES = {
  referralBonus: {
    subject: '🎁 Bạn nhận được +{{bonusPlays}} lượt chơi từ Santa Jump!',
    fromName: 'Santa Jump',
    fromEmail: 'onboarding@resend.dev',
    htmlTemplate: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="font-size: 48px; margin-bottom: 16px;">🎁</div>
    <h1 style="color: #111827; margin: 0 0 8px; font-size: 24px;">Chúc mừng!</h1>
    <p style="color: #4b5563; margin: 0; font-size: 16px;">
      Bạn nhận được <strong>+{{bonusPlays}} lượt chơi</strong> khi mời thành công <strong style="color: #059669;">{{refereeEmail}}</strong>
    </p>
  </div>
  <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px; border: 1px solid #e5e7eb;">
    <p style="color: #6b7280; margin: 0 0 8px; font-size: 14px;">Tổng cộng bạn nhận được</p>
    <div style="color: #059669; font-size: 32px; font-weight: bold;">+{{bonusPlays}} lượt chơi</div>
  </div>
  <div style="text-align: center;">
    <a href="{{appUrl}}" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 16px;">
      Vào chơi ngay 🎮
    </a>
  </div>
  <div style="text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px;">
    <p>Mắt Kính Tâm Đức - Santa Jump Game</p>
  </div>
</div>`,
  },
  otpLogin: {
    subject: '🎅 Mã OTP đăng nhập Santa Jump',
    fromName: 'Santa Jump',
    fromEmail: 'gaming@matkinhtamduc.com',
    htmlTemplate: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 30px; border-radius: 15px; text-align: center;">
    <h1 style="color: #FFD700; margin: 0; font-size: 28px;">🎅 SANTA JUMP 🎄</h1>
    <p style="color: #22c55e; margin: 10px 0; font-size: 18px;">Mắt Kính Tâm Đức</p>
  </div>
  <div style="background: #f0f9ff; padding: 30px; border-radius: 15px; margin-top: 20px; text-align: center;">
    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Mã OTP của bạn là:</p>
    <div style="background: #1e3a5f; color: #FFD700; font-size: 36px; font-weight: bold; padding: 20px 40px; border-radius: 10px; letter-spacing: 8px; display: inline-block;">
      {{otp}}
    </div>
    <p style="color: #666; font-size: 14px; margin-top: 20px;">Mã có hiệu lực trong 5 phút</p>
  </div>
  <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
    By Chief Everything Officer
  </p>
</div>`,
  },
  referralCompletion: {
    subject: '🎁 Bạn nhận được lượt chơi mới!',
    fromName: 'Santa Jump',
    fromEmail: 'gaming@matkinhtamduc.com',
    htmlTemplate: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 30px; border-radius: 15px; text-align: center;">
    <h1 style="color: #FFD700; margin: 0; font-size: 28px;">🎅 SANTA JUMP 🎄</h1>
    <p style="color: #22c55e; margin: 10px 0; font-size: 18px;">Mắt Kính Tâm Đức</p>
  </div>
  <div style="background: #f0f9ff; padding: 30px; border-radius: 15px; margin-top: 20px; text-align: center;">
    <h2 style="color: #1e3a5f; margin-top: 0;">Chúc mừng! 🎉</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.5;">
      Bạn bè của bạn đã tham gia trò chơi và hoàn thành lượt chơi đầu tiên.
    </p>
    <div style="background: #22c55e; color: white; font-size: 24px; font-weight: bold; padding: 15px 30px; border-radius: 10px; display: inline-block; margin: 20px 0;">
      +{{bonusPlays}} Lượt Chơi
    </div>
    <p style="color: #666; font-size: 14px;">
      Hãy vào game ngay để sử dụng lượt chơi mới nhé!
    </p>
    <a href="{{appUrl}}" style="display: inline-block; background: #FFD700; color: #000; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 25px; margin-top: 10px;">Chơi Ngay</a>
  </div>
  <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
    By Chief Everything Officer
  </p>
</div>`,
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
      .from('email_templates')
      .select('templates')
      .eq('id', 'main')
      .single()

    if (error || !data) {
      // Return defaults if not found
      return NextResponse.json({ templates: DEFAULT_TEMPLATES })
    }

    // Merge with defaults to ensure all fields exist
    const templates = { ...DEFAULT_TEMPLATES, ...data.templates }
    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Get email templates error:', error)
    return NextResponse.json({ error: 'Failed to get templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await verifyAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { templates } = await request.json()

    if (!templates) {
      return NextResponse.json({ error: 'Templates required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('email_templates')
      .upsert({
        id: 'main',
        templates,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Save email templates error:', error)
      return NextResponse.json({ error: 'Lỗi lưu templates: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Email templates đã được lưu' })
  } catch (error) {
    console.error('Save email templates error:', error)
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 })
  }
}
