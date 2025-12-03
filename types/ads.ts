// TypeScript types for advertising system

export interface AdPlacement {
    id: string
    placement_key: 'ground_banner' | 'loading_screen' | 'game_over' | 'leaderboard' | 'voucher_redemption'
    title: string
    description: string | null
    is_enabled: boolean
    display_order: number
    created_at: string
    updated_at: string
}

export interface AdContent {
    id: string
    placement_id: string
    sponsor_name: string
    logo_url: string
    link_url: string | null
    display_text: string | null
    display_order: number
    is_active: boolean
    start_date: string | null
    end_date: string | null
    created_at: string
    updated_at: string
}

export interface AdImpression {
    id: string
    ad_content_id: string
    user_id: string | null
    placement_key: string
    session_id: string | null
    created_at: string
}

// Extended types with relations
export interface AdPlacementWithContents extends AdPlacement {
    ad_contents: AdContent[]
}

export interface AdContentWithPlacement extends AdContent {
    placement: AdPlacement
}

// API request/response types
export interface CreateAdContentRequest {
    placement_id: string
    sponsor_name: string
    logo_url: string
    link_url?: string
    display_text?: string
    display_order?: number
    start_date?: string
    end_date?: string
}

export interface UpdateAdContentRequest extends Partial<CreateAdContentRequest> {
    is_active?: boolean
}

export interface TrackImpressionRequest {
    ad_content_id: string
    placement_key: string
    session_id?: string
}

export interface AdStats {
    placement_key: string
    total_impressions: number
    unique_users: number
    top_ads: {
        ad_content_id: string
        sponsor_name: string
        impressions: number
    }[]
}

// Frontend component props
export interface AdComponentProps {
    placementKey: AdPlacement['placement_key']
    className?: string
    onImpression?: (adContentId: string) => void
}
