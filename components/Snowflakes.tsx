'use client'

import { useEffect, useState } from 'react'

interface Snowflake {
  id: number
  left: number
  size: number
  duration: number
  delay: number
}

export default function Snowflakes() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([])

  useEffect(() => {
    const flakes: Snowflake[] = []
    for (let i = 0; i < 15; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100,
        size: Math.random() * 0.8 + 0.5,
        duration: Math.random() * 5 + 8,
        delay: Math.random() * 5,
      })
    }
    setSnowflakes(flakes)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake will-change-transform"
          style={{
            left: `${flake.left}%`,
            fontSize: `${flake.size}em`,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
          }}
        >
          ❄
        </div>
      ))}
    </div>
  )
}
