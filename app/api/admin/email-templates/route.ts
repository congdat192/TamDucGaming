import { NextRequest, NextResponse } from 'next/server'
import { getEmailTemplates, saveEmailTemplates } from '@/lib/emailTemplates'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'santa-jump-secret'

export const dynamic = 'force-dynamic'

// Verify admin authentication
async function verifyAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-token')?.value

    if (!token) {
      return false
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { isAdmin: boolean }
    return decoded.isAdmin === true
  } catch {
    return false
  }
}

// GET - Return all email templates
export async function GET(request: NextRequest) {
  try {
    // Check auth
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await getEmailTemplates()
    return NextResponse.json({ templates })

  } catch (error) {
    console.error('Get email templates error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// POST - Save email templates
export async function POST(request: NextRequest) {
  try {
    // Check auth
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { templates } = body

    if (!templates) {
      return NextResponse.json({ error: 'Missing templates' }, { status: 400 })
    }

    const result = await saveEmailTemplates(templates)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Save email templates error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
