import { NextRequest, NextResponse } from 'next/server'
import { getEmailTemplates } from '@/lib/emailTemplates'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'santa-jump-secret'

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { isAdmin: boolean }
      if (!decoded.isAdmin) {
        throw new Error('Not admin')
      }
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (!type) {
      return NextResponse.json({ error: 'Missing type' }, { status: 400 })
    }

    const templates = await getEmailTemplates()

    // Map type to template key
    let template
    switch (type) {
      case 'otp':
        template = templates.otpLogin
        break
      case 'referral_bonus':
        template = templates.referralBonus
        break
      case 'referral_completion':
        template = templates.referralCompletion
        break
      case 'voucher_claim':
        template = templates.voucherClaim
        break
      default:
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })

  } catch (error) {
    console.error('Get email template error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
