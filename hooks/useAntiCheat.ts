/**
 * React Hook for Anti-Cheat Protection
 * Combines DevTools detection, fingerprinting, and touch verification
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { setupDevToolsProtection } from '@/lib/detectDevTools'
import { getDeviceFingerprint, isSuspiciousFingerprint, calculateSuspicionScore, type DeviceFingerprint } from '@/lib/userAgent'

export interface AntiCheatStatus {
  devToolsOpen: boolean
  touchVerified: boolean
  fingerprintSuspicious: boolean
  suspicionScore: number
  fingerprint: DeviceFingerprint | null
  isSecure: boolean
}

export interface UseAntiCheatOptions {
  requireTouch?: boolean
  blockDevTools?: boolean
  checkFingerprint?: boolean
  onViolation?: (reason: string) => void
}

export function useAntiCheat(options: UseAntiCheatOptions = {}) {
  const {
    requireTouch = true,
    blockDevTools = true,
    checkFingerprint = true,
    onViolation
  } = options

  const [status, setStatus] = useState<AntiCheatStatus>({
    devToolsOpen: false,
    touchVerified: !requireTouch, // If not required, mark as verified
    fingerprintSuspicious: false,
    suspicionScore: 0,
    fingerprint: null,
    isSecure: false
  })

  // Get device fingerprint on mount
  useEffect(() => {
    if (!checkFingerprint) return

    try {
      const fingerprint = getDeviceFingerprint()
      const suspicious = isSuspiciousFingerprint(fingerprint)
      const score = calculateSuspicionScore(fingerprint)

      setStatus(prev => ({
        ...prev,
        fingerprint,
        fingerprintSuspicious: suspicious,
        suspicionScore: score
      }))

      if (suspicious) {
        console.warn('[ANTI-CHEAT] Suspicious device fingerprint detected', {
          platform: fingerprint.platform,
          userAgent: fingerprint.userAgent,
          suspicionScore: score
        })
        onViolation?.('Suspicious device fingerprint')
      }
    } catch (error) {
      console.error('[ANTI-CHEAT] Failed to get fingerprint:', error)
    }
  }, [checkFingerprint, onViolation])

  // Setup DevTools protection
  useEffect(() => {
    if (!blockDevTools) return

    const cleanup = setupDevToolsProtection({
      onDetected: () => {
        setStatus(prev => ({ ...prev, devToolsOpen: true }))
        onViolation?.('DevTools detected')
      }
    })

    return cleanup
  }, [blockDevTools, onViolation])

  // Touch verification
  const verifyTouch = useCallback(() => {
    setStatus(prev => ({ ...prev, touchVerified: true }))
  }, [])

  useEffect(() => {
    if (!requireTouch) return

    const handleTouch = () => {
      verifyTouch()
    }

    window.addEventListener('touchstart', handleTouch, { once: true })

    return () => {
      window.removeEventListener('touchstart', handleTouch)
    }
  }, [requireTouch, verifyTouch])

  // Calculate overall security status
  useEffect(() => {
    const isSecure =
      !status.devToolsOpen &&
      status.touchVerified &&
      !status.fingerprintSuspicious

    setStatus(prev => ({ ...prev, isSecure }))
  }, [status.devToolsOpen, status.touchVerified, status.fingerprintSuspicious])

  return {
    status,
    verifyTouch,
    getFingerprint: () => status.fingerprint
  }
}
