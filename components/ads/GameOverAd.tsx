'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import type { AdContent } from '@/types/ads'

interface GameOverAdProps {
    score: number
    className?: string
}

export default function GameOverAd({ score, className = '' }: GameOverAdProps) {
    const [ad, setAd] = useState<AdContent | null>(null)

    useEffect(() => {
        async function fetchAd() {
            try {
                const res = await fetch('/api/ads/contents?placement_key=game_over&active_only=true')
                const data = await res.json()

                if (data.contents && data.contents.length > 0) {
                    // Get random ad
                    const randomAd = data.contents[Math.floor(Math.random() * data.contents.length)]
                    setAd(randomAd)

                    // Track impression
                    fetch('/api/ads/track-impression', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ad_content_id: randomAd.id,
                            placement_key: 'game_over'
                        })
                    }).catch(err => console.error('[GameOverAd] Failed to track:', err))
                }
            } catch (error) {
                console.error('[GameOverAd] Failed to fetch ad:', error)
            }
        }

        fetchAd()
    }, [])

    if (!ad) {
        return null
    }

    return (
        <div className={`game-over-ad ${className}`}>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                {/* Logo */}
                <div className="relative w-[120px] h-[120px] mx-auto mb-3">
                    <Image
                        src={ad.logo_url}
                        alt={ad.sponsor_name}
                        fill
                        className="object-contain"
                        unoptimized
                    />
                </div>

                {/* Text */}
                <div className="text-center">
                    {ad.display_text ? (
                        <p className="text-white text-sm font-medium">
                            {ad.display_text}
                        </p>
                    ) : (
                        <>
                            <p className="text-white/60 text-xs mb-1">Tài trợ bởi</p>
                            <p className="text-white text-sm font-bold">{ad.sponsor_name}</p>
                        </>
                    )}

                    {/* Optional link */}
                    {ad.link_url && (
                        <a
                            href={ad.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-3 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg transition-colors"
                        >
                            Tìm hiểu thêm →
                        </a>
                    )}
                </div>
            </div>
        </div>
    )
}
