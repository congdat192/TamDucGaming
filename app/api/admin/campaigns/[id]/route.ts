import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toVietnamStartOfDayUTC, toVietnamEndOfDayUTC } from '@/lib/date'

// Simple admin authentication
function isAuthenticated(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return false

    const token = authHeader.replace('Bearer ', '')
    return token.startsWith('admin-token')
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        if (!isAuthenticated(request)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { is_active, name, description, start_date, end_date } = body

        const updates: any = {}
        if (typeof is_active === 'boolean') updates.is_active = is_active
        if (name) updates.name = name
        if (description !== undefined) updates.description = description


        if (start_date) updates.start_date = toVietnamStartOfDayUTC(start_date)
        if (end_date) updates.end_date = toVietnamEndOfDayUTC(end_date)

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No fields to update' },
                { status: 400 }
            )
        }

        const { data: campaign, error } = await supabase
            .from('campaigns')
            .update(updates)
            .eq('id', params.id)
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            campaign
        })

    } catch (error) {
        console.error('Update campaign error:', error)
        return NextResponse.json(
            { error: 'Failed to update campaign' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        if (!isAuthenticated(request)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { error } = await supabase
            .from('campaigns')
            .delete()
            .eq('id', params.id)

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true
        })

    } catch (error) {
        console.error('Delete campaign error:', error)
        return NextResponse.json(
            { error: 'Failed to delete campaign' },
            { status: 500 }
        )
    }
}
