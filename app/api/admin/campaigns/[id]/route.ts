import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

        const { is_active } = await request.json()

        if (typeof is_active !== 'boolean') {
            return NextResponse.json(
                { error: 'is_active must be a boolean' },
                { status: 400 }
            )
        }

        const { data: campaign, error } = await supabase
            .from('campaigns')
            .update({ is_active })
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
