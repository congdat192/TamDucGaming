'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import type { AdContent } from '@/types/ads'

interface LoadingScreenAdProps {
    onComplete: () => void
    duration?: number // milliseconds
}

export default function LoadingScreenAd({
    onComplete,
    duration = 2500
}: LoadingScreenAdProps) {
    const [ad, setAd] = useState<AdContent | null>(null)
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        async function fetchAd() {
            try {
                const res = await fetch('/api/ads/contents?placement_key=loading_screen&active_only=true')
                const data = await res.json()

                if (data.contents && data.contents.length > 0) {
                    // Get random ad or first one
                    const randomAd = data.contents[Math.floor(Math.random() * data.contents.length)]
                    setAd(randomAd)

                    // Track impression
                    fetch('/api/ads/track-impression', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ad_content_id: randomAd.id,
                            placement_key: 'loading_screen'
                        })
                    }).catch(err => console.error('[LoadingScreenAd] Failed to track:', err))
                }
            } catch (error) {
                console.error('[LoadingScreenAd] Failed to fetch ad:', error)
            }
        }

        fetchAd()

        // Auto-hide after duration
        const timer = setTimeout(() => {
            setIsVisible(false)
            setTimeout(onComplete, 300) // Wait for fade out
        }, duration)

        return () => clearTimeout(timer)
    }, [duration, onComplete])

    if (!ad || !isVisible) {
        return null
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-blue-900 to-blue-950 animate-in fade-in duration-300">
            {/* Snowflake background */}
            <div className="absolute inset-0 opacity-20">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute text-white text-2xl animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`
                        }}
                    >
                        ❄️
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="relative z-10 text-center">
                {/* Logo */}
                <div className="relative w-[200px] h-[200px] mx-auto mb-6 animate-in zoom-in duration-500">
                    <Image
                        src={ad.logo_url}
                        alt={ad.sponsor_name}
                        fill
                        className="object-contain drop-shadow-2xl"
                        unoptimized
                    />
                </div>

                {/* Text */}
                <div className="animate-in slide-in-from-bottom-4 duration-700">
                    <p className="text-white/60 text-sm mb-2">Presented by</p>
                    <h2 className="text-white text-2xl font-bold mb-4">{ad.sponsor_name}</h2>

                    {ad.display_text && (
                        <p className="text-white/80 text-sm max-w-md mx-auto">
                            {ad.display_text}
                        </p>
                    )}
                </div>

                {/* Loading indicator */}
                <div className="mt-8 flex justify-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    )
}
