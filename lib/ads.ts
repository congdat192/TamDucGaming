import { supabase } from './supabase'
import { supabaseAdmin } from './supabase-admin'
import type { AdPlacement, AdContent, AdPlacementWithContents } from '@/types/ads'

/**
 * Get active placement with its ad contents
 * Filters by enabled placement, active contents, and date range
 */
export async function getActivePlacement(
    placementKey: string
): Promise<AdPlacementWithContents | null> {
    const { data: placement, error } = await supabase
        .from('ad_placements')
        .select(`
      *,
      ad_contents (*)
    `)
        .eq('placement_key', placementKey)
        .eq('is_enabled', true)
        .single()

    if (error || !placement) {
        console.error(`[ADS] Failed to fetch placement: ${placementKey}`, error)
        return null
    }

    // Filter active contents within date range
    const now = new Date()
    const activeContents = (placement.ad_contents || []).filter((content: AdContent) => {
        if (!content.is_active) return false

        // Check date range
        if (content.start_date && new Date(content.start_date) > now) return false
        if (content.end_date && new Date(content.end_date) < now) return false

        return true
    })

    // Sort by display_order
    activeContents.sort((a: AdContent, b: AdContent) => a.display_order - b.display_order)

    return {
        ...placement,
        ad_contents: activeContents
    }
}

/**
 * Get all active ad contents for a placement
 */
export async function getActiveAdContents(placementKey: string): Promise<AdContent[]> {
    const placement = await getActivePlacement(placementKey)
    return placement?.ad_contents || []
}

/**
 * Track ad impression
 */
export async function trackAdImpression(params: {
    adContentId: string
    placementKey: string
    userId?: string
    sessionId?: string
}): Promise<boolean> {
    try {
        const { error } = await supabaseAdmin
            .from('ad_impressions')
            .insert({
                ad_content_id: params.adContentId,
                placement_key: params.placementKey,
                user_id: params.userId || null,
                session_id: params.sessionId || null
            })

        if (error) {
            console.error('[ADS] Failed to track impression:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('[ADS] Exception tracking impression:', error)
        return false
    }
}

/**
 * Check if ad should be shown
 */
export function shouldShowAd(content: AdContent): boolean {
    if (!content.is_active) return false

    const now = new Date()

    // Check start date
    if (content.start_date && new Date(content.start_date) > now) {
        return false
    }

    // Check end date
    if (content.end_date && new Date(content.end_date) < now) {
        return false
    }

    return true
}

/**
 * Get random ad content from array
 */
export function getRandomAdContent(contents: AdContent[]): AdContent | null {
    if (contents.length === 0) return null
    const randomIndex = Math.floor(Math.random() * contents.length)
    return contents[randomIndex]
}

/**
 * Get ad stats for analytics
 */
export async function getAdStats(placementKey?: string) {
    let query = supabaseAdmin
        .from('ad_impressions')
        .select(`
      placement_key,
      ad_content_id,
      user_id,
      ad_contents (
        sponsor_name
      )
    `)

    if (placementKey) {
        query = query.eq('placement_key', placementKey)
    }

    const { data, error } = await query

    if (error) {
        console.error('[ADS] Failed to fetch stats:', error)
        return null
    }

    // Aggregate stats
    const stats: Record<string, any> = {}

    data?.forEach((impression: any) => {
        const key = impression.placement_key
        if (!stats[key]) {
            stats[key] = {
                placement_key: key,
                total_impressions: 0,
                unique_users: new Set(),
                ad_breakdown: {}
            }
        }

        stats[key].total_impressions++

        if (impression.user_id) {
            stats[key].unique_users.add(impression.user_id)
        }

        const adId = impression.ad_content_id
        if (!stats[key].ad_breakdown[adId]) {
            stats[key].ad_breakdown[adId] = {
                ad_content_id: adId,
                sponsor_name: impression.ad_contents?.sponsor_name || 'Unknown',
                impressions: 0
            }
        }
        stats[key].ad_breakdown[adId].impressions++
    })

    // Convert to array and format
    return Object.values(stats).map((stat: any) => ({
        placement_key: stat.placement_key,
        total_impressions: stat.total_impressions,
        unique_users: stat.unique_users.size,
        top_ads: Object.values(stat.ad_breakdown)
            .sort((a: any, b: any) => b.impressions - a.impressions)
            .slice(0, 5)
    }))
}
