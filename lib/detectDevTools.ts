/**
 * DevTools Detection
 * Purpose: Detect when browser DevTools (F12) is open to prevent hacking
 */

/**
 * Check if DevTools is currently open
 * Uses multiple detection methods for reliability
 */
export function isDevToolsOpen(): boolean {
  // Method 1: Check window size difference
  const threshold = 160
  const widthThreshold = window.outerWidth - window.innerWidth > threshold
  const heightThreshold = window.outerHeight - window.innerHeight > threshold

  // Method 2: Check if console is detached
  const isConsoleOpen = /./
  isConsoleOpen.toString = function() {
    return 'devtools-open'
  }

  // Method 3: Performance-based detection
  let isOpenByTiming = false
  const start = performance.now()

  // debugger statement pauses if DevTools is open
  // Use a function wrapper to avoid linter warnings
  const checkDebugger = new Function('debugger')
  try {
    checkDebugger()
  } catch (e) {
    // Ignore errors
  }

  const end = performance.now()

  // If execution took more than 100ms, DevTools is likely open
  if (end - start > 100) {
    isOpenByTiming = true
  }

  return widthThreshold || heightThreshold || isOpenByTiming
}

/**
 * Continuous monitoring of DevTools
 * Calls callback when DevTools is detected
 */
export function monitorDevTools(
  onDetected: () => void,
  intervalMs: number = 1000
): () => void {
  const interval = setInterval(() => {
    if (isDevToolsOpen()) {
      onDetected()
    }
  }, intervalMs)

  // Return cleanup function
  return () => clearInterval(interval)
}

/**
 * One-time setup for DevTools detection with automatic blocking
 */
export function setupDevToolsProtection(options?: {
  message?: string
  redirectUrl?: string
  onDetected?: () => void
}) {
  const defaultMessage = '⚠️ Vui lòng đóng DevTools (F12) để chơi game'
  const message = options?.message || defaultMessage

  const handleDetection = () => {
    if (options?.onDetected) {
      options.onDetected()
    } else {
      alert(message)
      if (options?.redirectUrl) {
        window.location.href = options.redirectUrl
      } else {
        window.location.reload()
      }
    }
  }

  // Start monitoring
  const cleanup = monitorDevTools(handleDetection, 1000)

  // Also check on focus/blur (user might open DevTools while away)
  const handleVisibilityChange = () => {
    if (!document.hidden && isDevToolsOpen()) {
      handleDetection()
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  // Return cleanup function
  return () => {
    cleanup()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}
