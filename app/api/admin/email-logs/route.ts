import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const emailType = searchParams.get('type') // otp, referral_bonus, etc.
    const provider = searchParams.get('provider') // resend, gmail
    const status = searchParams.get('status') // success, failed
    const search = searchParams.get('search') // search by email

    const offset = (page - 1) * limit

    // Build query
    let query = supabaseAdmin
      .from('email_logs')
      .select('*', { count: 'exact' })

    // Apply filters
    if (emailType) {
      query = query.eq('email_type', emailType)
    }
    if (provider) {
      query = query.eq('provider', provider)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (search) {
      query = query.ilike('to_email', `%${search}%`)
    }

    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Error fetching email logs:', error)
      return NextResponse.json(
        { error: 'Không thể lấy danh sách email logs' },
        { status: 500 }
      )
    }

    // Get stats
    const { data: statsData } = await supabaseAdmin
      .from('email_logs')
      .select('status, provider')

    const stats = {
      total: statsData?.length || 0,
      success: statsData?.filter(s => s.status === 'success').length || 0,
      failed: statsData?.filter(s => s.status === 'failed').length || 0,
      byProvider: {
        resend: statsData?.filter(s => s.provider === 'resend').length || 0,
        gmail: statsData?.filter(s => s.provider === 'gmail').length || 0
      }
    }

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats
    })

  } catch (error) {
    console.error('Email logs API error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
