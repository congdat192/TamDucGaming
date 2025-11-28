/**
 * User Agent detection utilities
 * Purpose: Block desktop browsers from playing game (mobile-only game)
 */

/**
 * Detect if request is from desktop browser (server-side check)
 */
export function isDesktopBrowser(userAgent: string | null): boolean {
  if (!userAgent) return false

  const ua = userAgent.toLowerCase()

  // Check for mobile indicators first
  const mobileKeywords = [
    'mobile',
    'android',
    'iphone',
    'ipad',
    'ipod',
    'blackberry',
    'windows phone',
    'webos'
  ]

  const isMobile = mobileKeywords.some(keyword => ua.includes(keyword))

  // If mobile detected, not desktop
  if (isMobile) return false

  // Check for desktop OS indicators
  const desktopKeywords = [
    'macintosh',
    'windows nt',
    'linux x86_64',
    'x11'
  ]

  const isDesktop = desktopKeywords.some(keyword => ua.includes(keyword))

  return isDesktop
}

/**
 * Admin emails allowed to play on desktop (for testing/development)
 */
export const DESKTOP_WHITELIST_EMAILS = [
  'congdat192@gmail.com',
  'crazyloop2509@gmail.com'
]

/**
 * Check if user email is in desktop whitelist
 */
export function isDesktopWhitelisted(email: string | null): boolean {
  if (!email) return false
  return DESKTOP_WHITELIST_EMAILS.includes(email.toLowerCase())
}

/**
 * Device Fingerprint (client-side only)
 */
export interface DeviceFingerprint {
  userAgent: string
  platform: string
  maxTouchPoints: number
  screenWidth: number
  screenHeight: number
  deviceMemory?: number
  hardwareConcurrency?: number
  vendor: string
  hasTouch: boolean
}

/**
 * Get device fingerprint (client-side only - use in browser)
 */
export function getDeviceFingerprint(): DeviceFingerprint {
  if (typeof window === 'undefined') {
    throw new Error('getDeviceFingerprint can only be called in browser')
  }

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    screenWidth: screen.width,
    screenHeight: screen.height,
    deviceMemory: (navigator as any).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    vendor: navigator.vendor,
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }
}

/**
 * Detect if device fingerprint is suspicious (likely desktop emulating mobile)
 */
export function isSuspiciousFingerprint(fp: DeviceFingerprint): boolean {
  const ua = fp.userAgent.toLowerCase()

  // Check 1: User-Agent claims mobile but platform is desktop
  if (ua.includes('iphone') || ua.includes('android')) {
    // iPhone but platform is MacIntel → FAKE (desktop emulation)
    if (ua.includes('iphone') && fp.platform === 'MacIntel') {
      return true
    }

    // Android but platform is Win32/Linux x86_64 → FAKE
    if (ua.includes('android') && (fp.platform.includes('Win') || fp.platform.includes('Linux'))) {
      // Exception: Real Linux devices can be Android
      if (!fp.platform.includes('Linux armv')) {
        return true
      }
    }
  }

  // Check 2: Mobile user-agent but no touch support
  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    if (fp.maxTouchPoints === 0 && !fp.hasTouch) {
      return true
    }
  }

  // Check 3: Screen size inconsistencies
  // iPhone max width is ~500px, Android phones ~450px
  if (ua.includes('iphone')) {
    if (fp.screenWidth > 500 || fp.screenHeight > 1000) {
      return true
    }
  }

  // Check 4: Desktop vendor but mobile user-agent
  const desktopVendors = ['Google Inc.', 'Apple Computer, Inc.']
  if ((ua.includes('mobile') || ua.includes('iphone')) && desktopVendors.includes(fp.vendor)) {
    // This alone is not conclusive, but combined with other checks
    // Most mobile browsers have vendor = "Google Inc." too
  }

  return false
}

/**
 * Calculate suspicion score (0-100, higher = more suspicious)
 */
export function calculateSuspicionScore(fp: DeviceFingerprint): number {
  let score = 0
  const ua = fp.userAgent.toLowerCase()

  // Platform mismatch (+40 points)
  if (ua.includes('iphone') && fp.platform === 'MacIntel') score += 40
  if (ua.includes('android') && fp.platform.includes('Win')) score += 40

  // No touch support on mobile UA (+30 points)
  if ((ua.includes('mobile') || ua.includes('iphone')) && fp.maxTouchPoints === 0) {
    score += 30
  }

  // Screen size anomaly (+20 points)
  if (ua.includes('iphone') && fp.screenWidth > 500) score += 20

  // High device memory (mobile usually <8GB) (+10 points)
  if (fp.deviceMemory && fp.deviceMemory > 8) score += 10

  return Math.min(score, 100)
}
