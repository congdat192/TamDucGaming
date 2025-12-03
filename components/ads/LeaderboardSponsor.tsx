'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import type { AdContent } from '@/types/ads'

interface LeaderboardSponsorProps {
    className?: string
}

export default function LeaderboardSponsor({ className = '' }: LeaderboardSponsorProps) {
    const [ads, setAds] = useState<AdContent[]>([])

    useEffect(() => {
        async function fetchAds() {
            try {
                const res = await fetch('/api/ads/contents?placement_key=leaderboard&active_only=true')
                const data = await res.json()

                console.log('[LeaderboardSponsor] API Response:', data)
                console.log('[LeaderboardSponsor] Contents count:', data.contents?.length)

                if (data.contents && data.contents.length > 0) {
                    // Get up to 4 ads for grid display
                    setAds(data.contents.slice(0, 4))
                    console.log('[LeaderboardSponsor] Displaying ads:', data.contents.slice(0, 4))

                    // Track impressions for all displayed ads
                    data.contents.slice(0, 4).forEach((ad: AdContent) => {
                        fetch('/api/ads/track-impression', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ad_content_id: ad.id,
                                placement_key: 'leaderboard'
                            })
                        }).catch(err => console.error('[LeaderboardSponsor] Failed to track:', err))
                    })
                } else {
                    console.warn('[LeaderboardSponsor] No ads found!')
                }
            } catch (error) {
                console.error('[LeaderboardSponsor] Failed to fetch ads:', error)
            }
        }

        fetchAds()
    }, [])

    if (ads.length === 0) {
        return null
    }

    return (
        <div className={`leaderboard-sponsor ${className}`}>
            <div className="bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-yellow-500/10 rounded-2xl p-3 border border-yellow-500/20 backdrop-blur-sm">
                {/* Header */}
                <div className="text-center mb-2">
                    <p className="text-yellow-400 text-xs font-bold">✨ Tài trợ bởi ✨</p>
                </div>

                {/* Logos Grid - 1 row x 4 columns */}
                <div className={`grid gap-3 ${ads.length === 1 ? 'grid-cols-1' :
                    ads.length === 2 ? 'grid-cols-2' :
                        ads.length === 3 ? 'grid-cols-3' :
                            'grid-cols-4'
                    }`}>
                    {ads.map((ad) => (
                        <div
                            key={ad.id}
                            className="relative h-20 bg-white rounded-xl p-3 shadow-lg hover:shadow-xl transition-all group border-2 border-transparent hover:border-yellow-400"
                        >
                            <Image
                                src={ad.logo_url}
                                alt={ad.sponsor_name}
                                fill
                                className="object-contain p-2"
                                unoptimized
                            />
                            {/* Tooltip on hover */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                                {ad.sponsor_name}
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Optional display text */}
                {ads[0]?.display_text && (
                    <p className="text-center text-white/50 text-xs mt-3">
                        {ads[0].display_text}
                    </p>
                )}
            </div>
        </div>
    )
}
