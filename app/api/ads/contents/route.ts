import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const placementId = searchParams.get('placement_id')
        const placementKey = searchParams.get('placement_key')
        const activeOnly = searchParams.get('active_only') === 'true'

        let query = supabaseAdmin
            .from('ad_contents')
            .select(`
        *,
        placement:ad_placements (*)
      `)
            .order('display_order', { ascending: true })

        if (placementId) {
            query = query.eq('placement_id', placementId)
        }

        // First fetch to get all data
        const { data: allData, error: fetchError } = await query

        if (fetchError) {
            return NextResponse.json(
                { error: 'Failed to fetch ad contents' },
                { status: 500 }
            )
        }

        let filteredData = allData || []

        // Filter by placement_key if provided
        if (placementKey) {
            filteredData = filteredData.filter((content: any) =>
                content.placement?.placement_key === placementKey
            )
        }

        // Filter by active status and date range
        if (activeOnly) {
            const now = new Date()
            filteredData = filteredData.filter((content: any) => {
                if (!content.is_active) return false

                // Check date range
                if (content.start_date && new Date(content.start_date) > now) return false
                if (content.end_date && new Date(content.end_date) < now) return false

                return true
            })
        }

        return NextResponse.json({ contents: filteredData })
    } catch (error) {
        console.error('[API] /api/ads/contents GET error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            placement_id,
            sponsor_name,
            logo_url,
            link_url,
            display_text,
            display_order,
            start_date,
            end_date
        } = body

        if (!placement_id || !sponsor_name || !logo_url) {
            return NextResponse.json(
                { error: 'placement_id, sponsor_name, and logo_url are required' },
                { status: 400 }
            )
        }

        const { data, error } = await supabaseAdmin
            .from('ad_contents')
            .insert({
                placement_id,
                sponsor_name,
                logo_url,
                link_url,
                display_text,
                display_order: display_order ?? 0,
                start_date,
                end_date
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json(
                { error: 'Failed to create ad content' },
                { status: 500 }
            )
        }

        return NextResponse.json({ content: data })
    } catch (error) {
        console.error('[API] /api/ads/contents POST error:', error)
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

        const { data, error } = await supabaseAdmin
            .from('ad_contents')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            return NextResponse.json(
                { error: 'Failed to update ad content' },
                { status: 500 }
            )
        }

        return NextResponse.json({ content: data })
    } catch (error) {
        console.error('[API] /api/ads/contents PUT error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'id is required' },
                { status: 400 }
            )
        }

        const { error } = await supabaseAdmin
            .from('ad_contents')
            .delete()
            .eq('id', id)

        if (error) {
            return NextResponse.json(
                { error: 'Failed to delete ad content' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API] /api/ads/contents DELETE error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
