/**
 * Server-side score validation
 * Mục tiêu: Không tin dữ liệu từ client, tính max score dựa trên game config
 */

import { GAME_CONFIG } from '@/lib/game/constants'

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
const BUFFER_MULTIPLIER = 1.3 // Cho phép 30% buffer cho lag/luck/skill
const HARD_CAP_PER_GAME = 300 // Tối đa điểm/lượt (tăng từ 200 lên 300)
const DAILY_SCORE_CAP = 500 // Tối đa điểm/ngày

// Sanity check constants
const MIN_SECONDS_FOR_NONZERO_SCORE = 3 // Cần ít nhất 3 giây để có điểm
const MIN_SECONDS_PER_POINT = 1.2 // Trung bình mỗi điểm cần ít nhất 1.2 giây

/**
 * Tính số điểm tối đa có thể đạt được dựa trên thời gian chơi và config
 * Sử dụng GAME_CONFIG để tính chính xác thời gian obstacle di chuyển
 *
 * Logic:
 * 1. Tính thời gian để obstacle đầu tiên qua Santa (tFirstPoint)
 * 2. Tính số obstacle có thể spawn dựa trên spawn interval
 * 3. Thêm buffer 30% cho player giỏi
 * 4. Áp dụng hard cap
 */
export function computeMaxScoreAllowed(
  durationSeconds: number,
  config: GameConfigSnapshot
): number {
  // 0. Clamp duration để tránh giá trị cực đoan
  const safeDuration = Math.min(Math.max(durationSeconds, 0), MAX_GAME_DURATION)

  if (safeDuration < MIN_GAME_DURATION) {
    return 0 // Game quá ngắn
  }

  // 1. Tính thời gian để obstacle đầu tiên có thể cho điểm
  // Pipe bắt đầu từ cạnh phải và phải di chuyển qua Santa
  const obstacleWidth = config.obstacleWidth || GAME_CONFIG.OBSTACLE_WIDTH
  const obstacleSpeed = config.obstacleSpeed || GAME_CONFIG.OBSTACLE_SPEED

  // Khoảng cách obstacle phải di chuyển để Santa vượt qua
  const distanceToFirstPipe =
    GAME_CONFIG.WIDTH -
    GAME_CONFIG.SANTA_X -
    obstacleWidth

  // Thời gian để có điểm đầu tiên (giây)
  // obstacleSpeed là pixels/frame, assume 60fps -> pixels/second = speed * 60
  const pixelsPerSecond = obstacleSpeed * 60
  const tFirstPoint = distanceToFirstPipe / pixelsPerSecond

  if (safeDuration <= tFirstPoint) {
    // Không đủ thời gian để có điểm hợp lệ
    return 0
  }

  // 2. Thời gian giữa các điểm (spawn interval)
  const initialSpawnMs = config.spawnInterval || GAME_CONFIG.OBSTACLE_SPAWN_INTERVAL
  const minSpawnMs = config.minSpawnInterval || GAME_CONFIG.MIN_SPAWN_INTERVAL

  // Dùng effective interval (trung bình giữa initial và min)
  const effectiveIntervalMs = (initialSpawnMs + minSpawnMs) / 2
  const intervalSec = Math.max(effectiveIntervalMs / 1000, 0.4) // Tránh interval quá nhỏ

  // 3. Tính số điểm lý thuyết
  const remainingTime = safeDuration - tFirstPoint
  const possiblePointsAfterFirst = remainingTime > 0 ? remainingTime / intervalSec : 0
  const theoreticalMax = 1 + possiblePointsAfterFirst // +1 cho obstacle đầu tiên

  // 4. Thêm buffer 30% cho player giỏi
  const withBuffer = Math.floor(theoreticalMax * BUFFER_MULTIPLIER)

  // 5. Hard cap tuyệt đối
  return Math.min(withBuffer, HARD_CAP_PER_GAME)
}

/**
 * Tính max score theo cách cũ (weighted average spawn interval)
 * Giữ lại để so sánh nếu cần
 */
export function computeMaxScoreAllowedLegacy(
  durationSeconds: number,
  config: GameConfigSnapshot
): number {
  const safeDuration = Math.min(Math.max(durationSeconds, 0), MAX_GAME_DURATION)

  if (safeDuration < MIN_GAME_DURATION) {
    return 0
  }

  const initialSpawnMs = config.spawnInterval || 2500
  const minSpawnMs = config.minSpawnInterval || 1200

  const avgSpawnInterval = (initialSpawnMs + minSpawnMs) / 2
  const durationMs = safeDuration * 1000
  const estimatedObstacles = durationMs / avgSpawnInterval
  const theoreticalMax = Math.floor(estimatedObstacles)
  const withBuffer = Math.floor(theoreticalMax * BUFFER_MULTIPLIER)

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

  // Check 1: Duration quá ngắn
  if (durationSeconds < MIN_GAME_DURATION) {
    suspicionReasons.push(`Duration too short: ${durationSeconds.toFixed(1)}s < ${MIN_GAME_DURATION}s`)
    validatedScore = 0
  }

  // Check 2: Duration quá dài (chỉ cảnh báo)
  if (durationSeconds > MAX_GAME_DURATION) {
    suspicionReasons.push(`Duration too long: ${durationSeconds.toFixed(1)}s > ${MAX_GAME_DURATION}s`)
  }

  // Check 3: Score > 0 nhưng thời gian quá ngắn
  if (clientScore > 0 && durationSeconds < MIN_SECONDS_FOR_NONZERO_SCORE) {
    suspicionReasons.push(
      `Score ${clientScore} with duration ${durationSeconds.toFixed(1)}s < ${MIN_SECONDS_FOR_NONZERO_SCORE}s`
    )
    validatedScore = 0
  }

  // Check 4: Sanity check - mỗi điểm cần thời gian tối thiểu
  const minDurationForScore = clientScore * MIN_SECONDS_PER_POINT
  if (clientScore > 0 && durationSeconds < minDurationForScore) {
    suspicionReasons.push(
      `Impossible rate: ${clientScore} pts in ${durationSeconds.toFixed(1)}s (min ${minDurationForScore.toFixed(1)}s needed)`
    )
    // Tính lại score hợp lệ dựa trên thời gian
    const maxByRate = Math.floor(durationSeconds / MIN_SECONDS_PER_POINT)
    validatedScore = Math.min(validatedScore, maxByRate)
  }

  // Check 5: Score vs Max allowed từ game config
  const maxAllowed = computeMaxScoreAllowed(durationSeconds, config)

  if (clientScore > maxAllowed) {
    suspicionReasons.push(
      `score_exceeds_config_limit (score=${clientScore}, maxFromConfig=${maxAllowed}, duration=${durationSeconds.toFixed(1)}s)`
    )
    validatedScore = Math.min(validatedScore, maxAllowed)
  }

  // Check 6: Daily cap
  const remainingDailyCap = Math.max(0, DAILY_SCORE_CAP - todayTotalValidatedScore)

  if (validatedScore > remainingDailyCap) {
    suspicionReasons.push(
      `Daily cap exceeded: today=${todayTotalValidatedScore}, this=${validatedScore}, cap=${DAILY_SCORE_CAP}`
    )
    validatedScore = remainingDailyCap
  }

  // Check 7: Negative score
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
  DAILY_SCORE_CAP,
  MIN_SECONDS_FOR_NONZERO_SCORE,
  MIN_SECONDS_PER_POINT
}
