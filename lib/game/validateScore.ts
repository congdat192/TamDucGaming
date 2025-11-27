/**
 * Server-side score validation
 * Mục tiêu: Không tin dữ liệu từ client, tính max score dựa trên game config
 */

export interface GameConfigSnapshot {
  gravity: number
  jumpForce: number
  maxFallSpeed: number
  obstacleWidth: number
  gapHeight: number
  obstacleSpeed: number
  spawnInterval: number // ms
  speedIncrement: number
  speedIncrementInterval: number // ms
  maxSpeed: number
  gapDecrease: number
  minGap: number
  spawnIntervalDecrease: number // ms
  minSpawnInterval: number // ms
}

export interface ValidationResult {
  validatedScore: number
  suspicionReason: string | null
  isValid: boolean
}

// Constants
const MAX_GAME_DURATION = 300 // 5 phút - sau đó game quá dài
const MIN_GAME_DURATION = 3 // 3 giây - dưới mức này là hack
const BUFFER_MULTIPLIER = 1.2 // Cho phép 20% buffer cho lag/luck
const HARD_CAP_PER_GAME = 200 // Tối đa điểm/lượt
const DAILY_SCORE_CAP = 500 // Tối đa điểm/ngày

/**
 * Tính số điểm tối đa có thể đạt được dựa trên thời gian chơi và config
 *
 * Logic:
 * - Mỗi obstacle qua = 1 điểm
 * - spawnInterval giảm dần theo thời gian -> nhiều obstacle hơn
 * - Tính average spawn rate dựa trên config
 */
export function computeMaxScoreAllowed(
  durationSeconds: number,
  config: GameConfigSnapshot
): number {
  // 1. Giới hạn thời gian hợp lệ
  const safeDuration = Math.min(Math.max(durationSeconds, 0), MAX_GAME_DURATION)

  if (safeDuration < MIN_GAME_DURATION) {
    return 0 // Game quá ngắn
  }

  // 2. Tính spawn rate trung bình
  // spawnInterval giảm dần từ config.spawnInterval đến config.minSpawnInterval
  const initialSpawnMs = config.spawnInterval || 2500
  const minSpawnMs = config.minSpawnInterval || 1200
  const spawnDecreaseMs = config.spawnIntervalDecrease || 100
  const speedIncreaseIntervalMs = config.speedIncrementInterval || 5000

  // Số lần tăng tốc trong game
  const durationMs = safeDuration * 1000
  const numSpeedIncrements = Math.floor(durationMs / speedIncreaseIntervalMs)

  // Spawn interval giảm sau mỗi lần tăng tốc
  // Tính average spawn interval trong suốt game
  let totalSpawnIntervalMs = 0
  let currentSpawnInterval = initialSpawnMs

  for (let i = 0; i <= numSpeedIncrements; i++) {
    const intervalDuration = i < numSpeedIncrements
      ? speedIncreaseIntervalMs
      : (durationMs % speedIncreaseIntervalMs)

    totalSpawnIntervalMs += intervalDuration

    // Giảm spawn interval cho lần tăng tốc tiếp theo
    currentSpawnInterval = Math.max(
      currentSpawnInterval - spawnDecreaseMs,
      minSpawnMs
    )
  }

  // Average spawn interval (weighted)
  const avgSpawnMs = initialSpawnMs // Simplify: use initial as baseline

  // 3. Ước tính số obstacle có thể spawn
  // Cách đơn giản hơn: dùng average của initial và min spawn interval
  const avgSpawnInterval = (initialSpawnMs + minSpawnMs) / 2
  const estimatedObstacles = (durationMs / avgSpawnInterval)

  // 4. Điểm lý thuyết tối đa (mỗi obstacle = 1 điểm)
  const theoreticalMax = Math.floor(estimatedObstacles)

  // 5. Thêm buffer 20% cho lag/luck
  const withBuffer = Math.floor(theoreticalMax * BUFFER_MULTIPLIER)

  // 6. Hard cap tuyệt đối
  return Math.min(withBuffer, HARD_CAP_PER_GAME)
}

/**
 * Validate score từ client
 */
export function validateScore(
  clientScore: number,
  durationSeconds: number,
  config: GameConfigSnapshot,
  todayTotalValidatedScore: number = 0
): ValidationResult {
  const suspicionReasons: string[] = []
  let validatedScore = Math.max(0, Math.floor(clientScore))

  // Check 1: Duration hợp lệ
  if (durationSeconds < MIN_GAME_DURATION) {
    suspicionReasons.push(`Duration too short: ${durationSeconds.toFixed(1)}s < ${MIN_GAME_DURATION}s`)
    validatedScore = 0
  }

  if (durationSeconds > MAX_GAME_DURATION) {
    suspicionReasons.push(`Duration too long: ${durationSeconds.toFixed(1)}s > ${MAX_GAME_DURATION}s`)
    // Không reject, chỉ tính theo max duration
  }

  // Check 2: Score vs Max allowed
  const maxAllowed = computeMaxScoreAllowed(durationSeconds, config)

  if (clientScore > maxAllowed) {
    suspicionReasons.push(
      `Client score ${clientScore} > maxAllowed ${maxAllowed} (${durationSeconds.toFixed(1)}s)`
    )
    validatedScore = Math.min(validatedScore, maxAllowed)
  }

  // Check 3: Daily cap
  const remainingDailyCap = Math.max(0, DAILY_SCORE_CAP - todayTotalValidatedScore)

  if (validatedScore > remainingDailyCap) {
    suspicionReasons.push(
      `Daily cap exceeded: today=${todayTotalValidatedScore}, this=${validatedScore}, cap=${DAILY_SCORE_CAP}`
    )
    validatedScore = remainingDailyCap
  }

  // Check 4: Negative score
  if (clientScore < 0) {
    suspicionReasons.push(`Negative score: ${clientScore}`)
    validatedScore = 0
  }

  return {
    validatedScore,
    suspicionReason: suspicionReasons.length > 0 ? suspicionReasons.join(' | ') : null,
    isValid: suspicionReasons.length === 0
  }
}

/**
 * Hash IP + User Agent để tracking (privacy-friendly)
 */
export function hashClientInfo(ip: string | null, userAgent: string | null): string {
  const data = `${ip || 'unknown'}:${userAgent || 'unknown'}`
  // Simple hash for privacy
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(16)
}

// Export constants for use elsewhere
export const VALIDATION_CONSTANTS = {
  MAX_GAME_DURATION,
  MIN_GAME_DURATION,
  BUFFER_MULTIPLIER,
  HARD_CAP_PER_GAME,
  DAILY_SCORE_CAP
}
