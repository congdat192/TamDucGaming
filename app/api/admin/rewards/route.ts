import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET - List all rewards (including inactive)
export async function GET() {
  try {
    const { data: rewards, error } = await supabaseAdmin
      .from('rewards')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Load rewards error:', error)
      return NextResponse.json({ rewards: [] })
    }

    return NextResponse.json({ rewards: rewards || [] })
  } catch (error) {
    console.error('Load rewards error:', error)
    return NextResponse.json({ rewards: [] })
  }
}

// POST - Create new reward
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, type, value, points_required, image_url, stock } = body

    if (!name || !type || points_required === undefined) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    const { data: reward, error } = await supabaseAdmin
      .from('rewards')
      .insert({
        name,
        description: description || '',
        type,
        value: value || 0,
        points_required,
        image_url: image_url || null,
        stock: stock || 0,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Create reward error:', error)
      return NextResponse.json(
        { error: 'Không thể tạo quà tặng' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, reward })
  } catch (error) {
    console.error('Create reward error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}

// PUT - Update reward
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, type, value, points_required, image_url, stock, is_active } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Thiếu ID quà tặng' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (value !== undefined) updateData.value = value
    if (points_required !== undefined) updateData.points_required = points_required
    if (image_url !== undefined) updateData.image_url = image_url
    if (stock !== undefined) updateData.stock = stock
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: reward, error } = await supabaseAdmin
      .from('rewards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update reward error:', error)
      return NextResponse.json(
        { error: 'Không thể cập nhật quà tặng' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, reward })
  } catch (error) {
    console.error('Update reward error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}

// DELETE - Delete reward
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Thiếu ID quà tặng' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('rewards')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete reward error:', error)
      return NextResponse.json(
        { error: 'Không thể xóa quà tặng' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete reward error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    )
  }
}
