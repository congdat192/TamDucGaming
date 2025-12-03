import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const placementKey = searchParams.get('placement_key')

        let query = supabase
            .from('ad_placements')
            .select(`
        *,
        ad_contents (*)
      `)
            .order('display_order', { ascending: true })

        if (placementKey) {
            query = query.eq('placement_key', placementKey)
        }

        const { data, error } = await query

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch placements' },
                { status: 500 }
            )
        }

        return NextResponse.json({ placements: data })
    } catch (error) {
        console.error('[API] /api/ads/placements GET error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { placement_key, title, description, is_enabled, display_order } = body

        if (!placement_key || !title) {
            return NextResponse.json(
                { error: 'placement_key and title are required' },
                { status: 400 }
            )
        }

        const { data, error } = await supabase
            .from('ad_placements')
            .insert({
                placement_key,
                title,
                description,
                is_enabled: is_enabled ?? true,
                display_order: display_order ?? 0
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json(
                { error: 'Failed to create placement' },
                { status: 500 }
            )
        }

        return NextResponse.json({ placement: data })
    } catch (error) {
        console.error('[API] /api/ads/placements POST error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, ...updates } = body

        if (!id) {
            return NextResponse.json(
                { error: 'id is required' },
                { status: 400 }
            )
        }

        const { data, error } = await supabase
            .from('ad_placements')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            return NextResponse.json(
                { error: 'Failed to update placement' },
                { status: 500 }
            )
        }

        return NextResponse.json({ placement: data })
    } catch (error) {
        console.error('[API] /api/ads/placements PUT error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
