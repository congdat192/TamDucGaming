import { GAME_CONFIG, COLORS } from './constants'

interface Santa {
  x: number
  y: number
  velocity: number
  width: number
  height: number
}

interface Obstacle {
  x: number
  topHeight: number
  bottomY: number
  passed: boolean
}

interface Snowflake {
  x: number
  y: number
  size: number
  speed: number
}

type GamePhase = 'idle' | 'practice' | 'countdown' | 'playing' | 'gameover'

export class SantaJumpGame {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private santa: Santa
  private obstacles: Obstacle[] = []
  private snowflakes: Snowflake[] = []
  private score: number = 0
  private gameOver: boolean = false
  private gameStarted: boolean = false
  private phase: GamePhase = 'idle'
  private countdownValue: number = 3
  private countdownStartTime: number = 0
  private practiceStartTime: number = 0
  private animationId: number | null = null
  private lastObstacleTime: number = 0
  private lastSpeedIncrement: number = 0
  private currentSpeed: number = 0
  private currentGap: number = 0
  private currentSpawnInterval: number = 0  // Dynamic spawn interval
  private cameraOffset: number = 0  // For slide effect
  private previewObstacle: Obstacle | null = null  // Show obstacle during countdown
  private santaBox = { left: 0, right: 0, top: 0, bottom: 0 } // Reusable collision box
  private onScoreUpdate: (score: number) => void
  private onGameOver: (finalScore: number) => void
  private onPhaseChange?: (phase: GamePhase) => void // Event-driven phase updates
  private obstaclePool: Obstacle[] = [] // Object pooling for obstacles
  private lastJumpTime: number = 0 // Touch debouncing
  private lastFrameTime: number = 0 // FPS limiting
  private targetFPS: number = 30 // Target 30 FPS for mobile
  private frameInterval: number = 1000 / 30 // ~33ms per frame
  private mechanics: {
    gravity: number
    jumpForce: number
    maxFallSpeed: number
    obstacleWidth: number
    gapHeight: number
    obstacleSpeed: number
    spawnInterval: number
    speedIncrement: number
    speedIncrementInterval: number
    maxSpeed: number
    gapDecrease: number
    minGap: number
    spawnIntervalDecrease: number
    minSpawnInterval: number
  }
  private sfx?: {
    playJump: () => void
    playCollectGift: () => void
    playCollectGlasses: () => void
    playCollectStar: () => void
    playHitBomb: () => void
    playGameOver: () => void
  }

  constructor(
    canvas: HTMLCanvasElement,
    onScoreUpdate: (score: number) => void,
    onGameOver: (finalScore: number) => void,
    gameMechanics?: {
      gravity: number
      jumpForce: number
      maxFallSpeed: number
      obstacleWidth: number
      gapHeight: number
      obstacleSpeed: number
      spawnInterval: number
      speedIncrement: number
      speedIncrementInterval: number
      maxSpeed: number
      gapDecrease: number
      minGap: number
      spawnIntervalDecrease: number
      minSpawnInterval: number
    },
    sfx?: {
      playJump: () => void
      playCollectGift: () => void
      playCollectGlasses: () => void
      playCollectStar: () => void
      playHitBomb: () => void
      playGameOver: () => void
    },
    onPhaseChange?: (phase: GamePhase) => void
  ) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.onScoreUpdate = onScoreUpdate
    this.onGameOver = onGameOver
    this.onPhaseChange = onPhaseChange
    this.sfx = sfx

    // Use provided mechanics or fall back to GAME_CONFIG
    this.mechanics = gameMechanics || {
      gravity: GAME_CONFIG.GRAVITY,
      jumpForce: GAME_CONFIG.JUMP_FORCE,
      maxFallSpeed: GAME_CONFIG.MAX_FALL_SPEED,
      obstacleWidth: GAME_CONFIG.OBSTACLE_WIDTH,
      gapHeight: GAME_CONFIG.GAP_HEIGHT,
      obstacleSpeed: GAME_CONFIG.OBSTACLE_SPEED,
      spawnInterval: GAME_CONFIG.OBSTACLE_SPAWN_INTERVAL,
      speedIncrement: GAME_CONFIG.SPEED_INCREMENT,
      speedIncrementInterval: GAME_CONFIG.SPEED_INCREMENT_INTERVAL,
      maxSpeed: GAME_CONFIG.MAX_SPEED,
      gapDecrease: GAME_CONFIG.GAP_DECREASE,
      minGap: GAME_CONFIG.MIN_GAP,
      spawnIntervalDecrease: GAME_CONFIG.SPAWN_INTERVAL_DECREASE,
      minSpawnInterval: GAME_CONFIG.MIN_SPAWN_INTERVAL,
    }

    // Set canvas size with pixel ratio handling (Force 1 for max performance on mobile)
    const dpr = 1
    this.canvas.width = GAME_CONFIG.WIDTH * dpr
    this.canvas.height = GAME_CONFIG.HEIGHT * dpr
    this.canvas.style.width = `${GAME_CONFIG.WIDTH}px`
    this.canvas.style.height = `${GAME_CONFIG.HEIGHT}px`
    this.ctx.scale(dpr, dpr)

    // Initialize dynamic values from mechanics
    this.currentSpeed = this.mechanics.obstacleSpeed
    this.currentGap = this.mechanics.gapHeight
    this.currentSpawnInterval = this.mechanics.spawnInterval

    // Initialize Santa
    this.santa = {
      x: GAME_CONFIG.SANTA_X,
      y: GAME_CONFIG.HEIGHT / 2,
      velocity: 0,
      width: GAME_CONFIG.SANTA_WIDTH,
      height: GAME_CONFIG.SANTA_HEIGHT
    }

    // Initialize background cache
    this.initBackgroundCache()
    this.initGroundCache()
    this.initSantaCache()

    // Draw initial state
    this.drawStartScreen()
  }

  private groundCanvas: HTMLCanvasElement | null = null
  private santaCanvas: HTMLCanvasElement | null = null

  private initGroundCache(): void {
    this.groundCanvas = document.createElement('canvas')
    this.groundCanvas.width = GAME_CONFIG.WIDTH
    this.groundCanvas.height = GAME_CONFIG.GROUND_HEIGHT
    const ctx = this.groundCanvas.getContext('2d')!

    // Snow layer
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, GAME_CONFIG.WIDTH, 20)

    // Grass/ground
    ctx.fillStyle = COLORS.christmas.green
    ctx.fillRect(0, 20, GAME_CONFIG.WIDTH, GAME_CONFIG.GROUND_HEIGHT - 20)

    // Snow bumps
    ctx.fillStyle = '#FFFFFF'
    for (let i = 0; i < GAME_CONFIG.WIDTH; i += 40) {
      ctx.beginPath()
      ctx.arc(i + 20, 10, 15, Math.PI, 0)
      ctx.fill()
    }

    // Branding text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Mắt Kính Tâm Đức - matkinhtamduc.com', GAME_CONFIG.WIDTH / 2, 45)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '10px Arial'
    ctx.fillText('By Chief Everything Officer', GAME_CONFIG.WIDTH / 2, 60)
  }

  private initSantaCache(): void {
    this.santaCanvas = document.createElement('canvas')
    this.santaCanvas.width = GAME_CONFIG.SANTA_WIDTH
    this.santaCanvas.height = GAME_CONFIG.SANTA_HEIGHT
    const ctx = this.santaCanvas.getContext('2d')!
    const width = GAME_CONFIG.SANTA_WIDTH
    const height = GAME_CONFIG.SANTA_HEIGHT

    // Draw Santa relative to 0,0
    // Body (red suit)
    ctx.fillStyle = COLORS.christmas.red
    ctx.beginPath()
    ctx.ellipse(width / 2, height * 0.6, width * 0.4, height * 0.35, 0, 0, Math.PI * 2)
    ctx.fill()

    // Belt
    ctx.fillStyle = '#000000'
    ctx.fillRect(width * 0.15, height * 0.55, width * 0.7, height * 0.1)
    ctx.fillStyle = COLORS.christmas.gold
    ctx.fillRect(width * 0.35, height * 0.53, width * 0.3, height * 0.14)

    // Head
    ctx.fillStyle = '#FFE4C4'
    ctx.beginPath()
    ctx.arc(width / 2, height * 0.25, width * 0.3, 0, Math.PI * 2)
    ctx.fill()

    // Hat
    ctx.fillStyle = COLORS.christmas.red
    ctx.beginPath()
    ctx.moveTo(width * 0.2, height * 0.2)
    ctx.lineTo(width / 2, -height * 0.2) // Adjusted for local coords
    ctx.lineTo(width * 0.8, height * 0.2)
    ctx.closePath()
    ctx.fill()

    // Hat brim
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(width * 0.15, height * 0.15, width * 0.7, height * 0.1)

    // Hat ball
    ctx.beginPath()
    ctx.arc(width / 2, -height * 0.15, width * 0.1, 0, Math.PI * 2)
    ctx.fill()

    // Beard
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.ellipse(width / 2, height * 0.4, width * 0.25, height * 0.2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Eyes
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(width * 0.38, height * 0.22, 3, 0, Math.PI * 2)
    ctx.arc(width * 0.62, height * 0.22, 3, 0, Math.PI * 2)
    ctx.fill()

    // Cheeks
    ctx.fillStyle = '#FFB6C1'
    ctx.beginPath()
    ctx.arc(width * 0.25, height * 0.3, 5, 0, Math.PI * 2)
    ctx.arc(width * 0.75, height * 0.3, 5, 0, Math.PI * 2)
    ctx.fill()

    // Legs
    ctx.fillStyle = COLORS.christmas.red
    ctx.fillRect(width * 0.25, height * 0.8, width * 0.15, height * 0.2)
    ctx.fillRect(width * 0.6, height * 0.8, width * 0.15, height * 0.2)

    // Boots
    ctx.fillStyle = '#000000'
    ctx.fillRect(width * 0.2, height * 0.92, width * 0.25, height * 0.1)
    ctx.fillRect(width * 0.55, height * 0.92, width * 0.25, height * 0.1)
  }

  private drawStartScreen(): void {
    this.drawBackground()
    // this.drawSnow() // Removed snow
    this.drawGround()
    this.drawSanta()

    // Text is now handled by React overlay in GameCanvas component
  }

  private backgroundCanvas: HTMLCanvasElement | null = null


  private initBackgroundCache(): void {
    this.backgroundCanvas = document.createElement('canvas')
    this.backgroundCanvas.width = GAME_CONFIG.WIDTH
    this.backgroundCanvas.height = GAME_CONFIG.HEIGHT
    const ctx = this.backgroundCanvas.getContext('2d')!

    // Night sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.HEIGHT)
    gradient.addColorStop(0, '#0f172a')
    gradient.addColorStop(0.5, '#1e3a5f')
    gradient.addColorStop(1, '#2d4a6f')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT)

    // Stars
    ctx.fillStyle = '#FFFFFF'
    for (let i = 0; i < 30; i++) {
      const x = (i * 37) % GAME_CONFIG.WIDTH
      const y = (i * 23) % (GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT - 100)
      const size = (i % 3) + 1
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }

    // Moon
    ctx.fillStyle = '#FFF8DC'
    ctx.beginPath()
    ctx.arc(GAME_CONFIG.WIDTH - 60, 60, 30, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawBackground(): void {
    if (this.backgroundCanvas) {
      this.ctx.drawImage(this.backgroundCanvas, 0, 0)
    }
  }

  private drawGround(): void {
    const groundY = GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT
    if (this.groundCanvas) {
      this.ctx.drawImage(this.groundCanvas, 0, groundY)
    }
  }

  private drawSanta(): void {
    const { x, y } = this.santa
    if (this.santaCanvas) {
      this.ctx.drawImage(this.santaCanvas, x, y)
    }
  }

  private drawObstacle(obstacle: Obstacle): void {
    const { x, topHeight, bottomY } = obstacle
    const width = this.mechanics.obstacleWidth

    // Draw chimney style obstacles
    this.drawChimney(x, 0, width, topHeight, true)
    this.drawChimney(x, bottomY, width, GAME_CONFIG.HEIGHT - bottomY - GAME_CONFIG.GROUND_HEIGHT, false)
  }

  private chimneyPattern: CanvasPattern | null = null

  private initChimneyPattern(): void {
    const patternCanvas = document.createElement('canvas')
    const width = this.mechanics.obstacleWidth
    const height = 40 // Height of 2 rows of bricks
    patternCanvas.width = width
    patternCanvas.height = height
    const pCtx = patternCanvas.getContext('2d')!

    // Background
    pCtx.fillStyle = COLORS.christmas.brick
    pCtx.fillRect(0, 0, width, height)

    // Bricks
    pCtx.strokeStyle = '#5C3317'
    pCtx.lineWidth = 2
    const brickHeight = 20
    const brickWidth = width / 2

    for (let row = 0; row < 2; row++) {
      const offsetX = row % 2 === 0 ? 0 : brickWidth / 2
      for (let col = -1; col < 3; col++) {
        const bx = offsetX + col * brickWidth
        const by = row * brickHeight
        pCtx.strokeRect(bx, by, brickWidth, brickHeight)
      }
    }

    this.chimneyPattern = this.ctx.createPattern(patternCanvas, 'repeat')
  }

  private drawChimney(x: number, y: number, width: number, height: number, flipped: boolean): void {
    const ctx = this.ctx

    if (height <= 0) return

    // Use cached pattern
    if (!this.chimneyPattern) {
      this.initChimneyPattern()
    }

    ctx.fillStyle = this.chimneyPattern!

    // We need to translate the pattern so it aligns with the chimney
    ctx.save()
    ctx.translate(x, y)
    ctx.fillRect(0, 0, width, height)
    ctx.restore()

    // Chimney cap
    ctx.fillStyle = COLORS.christmas.chimney
    if (flipped) {
      ctx.fillRect(x - 5, y + height - 15, width + 10, 15)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(x - 5, y + height - 5, width + 10, 8)
    } else {
      ctx.fillRect(x - 5, y, width + 10, 15)
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.ellipse(x + width / 2, y, width * 0.6, 10, 0, Math.PI, 0)
      ctx.fill()
    }
  }

  private getObstacleFromPool(): Obstacle {
    return this.obstaclePool.pop() || { x: 0, topHeight: 0, bottomY: 0, passed: false }
  }

  private returnObstacleToPool(obstacle: Obstacle): void {
    if (this.obstaclePool.length < 10) { // Max pool size
      obstacle.passed = false
      this.obstaclePool.push(obstacle)
    }
  }

  private updateObstacles(): void {
    const now = Date.now()

    // Spawn new obstacle (using dynamic spawn interval)
    if (now - this.lastObstacleTime > this.currentSpawnInterval) {
      const minHeight = GAME_CONFIG.MIN_OBSTACLE_HEIGHT
      const maxHeight = GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT - this.currentGap - minHeight
      const topHeight = Math.random() * (maxHeight - minHeight) + minHeight

      const obstacle = this.getObstacleFromPool()
      obstacle.x = GAME_CONFIG.WIDTH
      obstacle.topHeight = topHeight
      obstacle.bottomY = topHeight + this.currentGap
      obstacle.passed = false
      this.obstacles.push(obstacle)

      this.lastObstacleTime = now
    }

    // Update obstacle positions
    for (const obstacle of this.obstacles) {
      obstacle.x -= this.currentSpeed

      if (!obstacle.passed && obstacle.x + this.mechanics.obstacleWidth < this.santa.x) {
        obstacle.passed = true
        this.score++
        // Call score update (already optimized with requestAnimationFrame in GameCanvas)
        this.onScoreUpdate(this.score)
        this.sfx?.playCollectStar()
      }
    }

    // Remove off-screen obstacles and return to pool
    while (this.obstacles.length > 0 && this.obstacles[0].x < -this.mechanics.obstacleWidth) {
      const removed = this.obstacles.shift()
      if (removed) this.returnObstacleToPool(removed)
    }

    // Increase difficulty progressively
    if (now - this.lastSpeedIncrement > this.mechanics.speedIncrementInterval) {
      // Increase speed
      if (this.currentSpeed < this.mechanics.maxSpeed) {
        this.currentSpeed += this.mechanics.speedIncrement
      }
      // Decrease gap (make it harder)
      if (this.currentGap > this.mechanics.minGap) {
        this.currentGap -= this.mechanics.gapDecrease
      }
      // Decrease spawn interval (obstacles appear more frequently)
      if (this.currentSpawnInterval > this.mechanics.minSpawnInterval) {
        this.currentSpawnInterval -= this.mechanics.spawnIntervalDecrease
        this.currentSpawnInterval = Math.max(this.currentSpawnInterval, this.mechanics.minSpawnInterval)
      }
      this.lastSpeedIncrement = now
    }
  }

  private checkCollision(): boolean {
    const santa = this.santa

    // Update reusable box
    this.santaBox.left = santa.x + 10
    this.santaBox.right = santa.x + santa.width - 10
    this.santaBox.top = santa.y + 5
    this.santaBox.bottom = santa.y + santa.height - 5

    // Ground collision
    if (this.santaBox.bottom > GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT) {
      return true
    }

    // Ceiling collision
    if (this.santaBox.top < 0) {
      return true
    }

    // Obstacle collision
    for (const obstacle of this.obstacles) {
      // Optimization: Only check if obstacle is within horizontal range
      if (obstacle.x > this.santaBox.right || obstacle.x + this.mechanics.obstacleWidth < this.santaBox.left) {
        continue
      }

      // Check top pipe
      if (this.santaBox.top < obstacle.topHeight) {
        return true
      }

      // Check bottom pipe
      if (this.santaBox.bottom > obstacle.bottomY) {
        return true
      }
    }

    return false
  }

  private drawScore(): void {
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = 'bold 36px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.strokeStyle = '#000000'
    this.ctx.lineWidth = 3
    this.ctx.strokeText(this.score.toString(), GAME_CONFIG.WIDTH / 2, 50)
    this.ctx.fillText(this.score.toString(), GAME_CONFIG.WIDTH / 2, 50)
  }

  private drawPracticeHint(): void {
    // Practice hint is now handled by React overlay in GameCanvas component
    // No need to draw text here to avoid overlap
  }

  private practiceLoop = (): void => {
    if (this.phase !== 'practice') {
      // Transition to countdown loop
      if (this.phase === 'countdown') {
        this.animationId = requestAnimationFrame(this.countdownLoop)
      }
      return
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT)

    // Draw background elements
    this.drawBackground()
    // this.drawSnow() // Removed snow

    // Update Santa physics (with ground boundary)
    this.santa.velocity += this.mechanics.gravity
    this.santa.velocity = Math.min(this.santa.velocity, this.mechanics.maxFallSpeed)
    this.santa.y += this.santa.velocity

    // Keep Santa above ground during practice
    const groundY = GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT - this.santa.height
    if (this.santa.y > groundY) {
      this.santa.y = groundY
      this.santa.velocity = 0
    }
    if (this.santa.y < 0) {
      this.santa.y = 0
      this.santa.velocity = 0
    }

    // Draw ground
    this.drawGround()

    // Draw static preview obstacles (not moving, just for demonstration)
    const practiceElapsed = Date.now() - this.practiceStartTime

    // Show 3 static obstacles at different positions
    const staticObstacles = [
      {
        x: GAME_CONFIG.WIDTH * 0.7,
        topHeight: 80,
        bottomY: 80 + this.currentGap,
        passed: false
      },
      {
        x: GAME_CONFIG.WIDTH * 0.85,
        topHeight: 150,
        bottomY: 150 + this.currentGap,
        passed: false
      },
      {
        x: GAME_CONFIG.WIDTH * 0.55,
        topHeight: 120,
        bottomY: 120 + this.currentGap,
        passed: false
      }
    ]

    // Draw static obstacles with semi-transparent effect
    this.ctx.globalAlpha = 0.6  // Make them semi-transparent
    staticObstacles.forEach(obstacle => this.drawObstacle(obstacle))
    this.ctx.globalAlpha = 1.0  // Reset opacity

    // Draw Santa
    this.drawSanta()

    // Draw practice hint
    this.drawPracticeHint()

    // Check if practice time is over (3 seconds)
    if (practiceElapsed >= 3000) {
      this.phase = 'countdown'
      this.countdownStartTime = Date.now()
      this.cameraOffset = 0
      // Clear practice obstacles
      this.obstacles = []
      // Create preview obstacle to show during countdown
      const topHeight = GAME_CONFIG.HEIGHT / 2 - this.currentGap / 2 - 50
      this.previewObstacle = {
        x: GAME_CONFIG.WIDTH + 100,
        topHeight,
        bottomY: topHeight + this.currentGap,
        passed: false
      }
    }

    this.animationId = requestAnimationFrame(this.practiceLoop)
  }

  private countdownLoop = (): void => {
    if (this.phase !== 'countdown') {
      if (this.phase === 'playing') {
        this.animationId = requestAnimationFrame(this.gameLoop)
      }
      return
    }

    const elapsed = Date.now() - this.countdownStartTime
    const remaining = Math.ceil((3000 - elapsed) / 1000)

    // Check if countdown is over
    if (remaining <= 0) {
      this.phase = 'playing'
      this.lastObstacleTime = Date.now()
      this.lastSpeedIncrement = Date.now()
      // Move preview obstacle to obstacles array
      if (this.previewObstacle) {
        this.obstacles.push(this.previewObstacle)
        this.previewObstacle = null
      }
      this.animationId = requestAnimationFrame(this.gameLoop)
      return
    }

    this.countdownValue = remaining

    // Clear canvas
    this.ctx.clearRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT)

    // Calculate camera slide progress (0 to 1 over 3 seconds)
    const slideProgress = Math.min(elapsed / 3000, 1)
    this.cameraOffset = slideProgress * 100  // Slide up to 100px

    // Draw background elements
    this.drawBackground()
    // this.drawSnow() // Removed snow

    // Update preview obstacle position (slide in from right)
    if (this.previewObstacle) {
      // Move obstacle from right edge towards more visible area
      const targetX = GAME_CONFIG.WIDTH * 0.65  // Position at 65% of width for better visibility
      const startX = GAME_CONFIG.WIDTH + 100
      this.previewObstacle.x = startX - (slideProgress * (startX - targetX))
      this.drawObstacle(this.previewObstacle)
    }

    // Draw ground
    this.drawGround()

    // Update and draw Santa
    this.santa.velocity += this.mechanics.gravity
    this.santa.velocity = Math.min(this.santa.velocity, this.mechanics.maxFallSpeed)
    this.santa.y += this.santa.velocity

    const groundY = GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT - this.santa.height
    if (this.santa.y > groundY) {
      this.santa.y = groundY
      this.santa.velocity = 0
    }
    if (this.santa.y < 0) {
      this.santa.y = 0
      this.santa.velocity = 0
    }

    this.drawSanta()

    // Draw countdown overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
    this.ctx.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT)

    // Draw countdown number
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 120px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'

    const scale = 1 + Math.sin((elapsed % 1000) / 1000 * Math.PI) * 0.2
    this.ctx.save()
    this.ctx.translate(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 30)
    this.ctx.scale(scale, scale)
    this.ctx.fillText(remaining.toString(), 0, 0)
    this.ctx.restore()

    // Draw "Get Ready" text
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = 'bold 24px Arial'
    this.ctx.textBaseline = 'alphabetic'
    this.ctx.fillText('ỐNG KHÓI ĐANG ĐẾN!', GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 60)

    this.animationId = requestAnimationFrame(this.countdownLoop)
  }

  private gameLoop = (): void => {
    if (this.gameOver || this.phase !== 'playing') return

    // FPS limiting - Target 30 FPS
    const now = performance.now()
    const elapsed = now - this.lastFrameTime

    if (elapsed < this.frameInterval) {
      this.animationId = requestAnimationFrame(this.gameLoop)
      return
    }

    this.lastFrameTime = now - (elapsed % this.frameInterval)

    // Clear canvas
    this.ctx.clearRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT)

    // Draw background elements
    this.drawBackground()
    // this.drawSnow() // Removed snow

    // Update Santa physics
    this.santa.velocity += this.mechanics.gravity
    this.santa.velocity = Math.min(this.santa.velocity, this.mechanics.maxFallSpeed)
    this.santa.y += this.santa.velocity

    // Update obstacles
    this.updateObstacles()

    // Draw obstacles
    for (const obstacle of this.obstacles) {
      this.drawObstacle(obstacle)
    }

    // Draw ground
    this.drawGround()

    // Draw Santa
    this.drawSanta()

    // Draw score
    this.drawScore()

    // Check collision
    if (this.checkCollision()) {
      this.endGame()
      return
    }

    this.animationId = requestAnimationFrame(this.gameLoop)
  }

  private setPhase(newPhase: GamePhase): void {
    if (this.phase !== newPhase) {
      this.phase = newPhase
      this.onPhaseChange?.(newPhase)
    }
  }

  public jump(): void {
    if (this.gameOver) return

    // Touch debouncing - prevent rapid taps (50ms minimum between jumps)
    const now = Date.now()
    if (now - this.lastJumpTime < 50) return
    this.lastJumpTime = now

    if (this.phase === 'idle') {
      this.startPractice()
      return
    }

    // Allow jumping during practice, countdown, and playing
    if (this.phase === 'practice' || this.phase === 'countdown' || this.phase === 'playing') {
      this.santa.velocity = this.mechanics.jumpForce
      this.sfx?.playJump()
    }
  }

  public getPhase(): GamePhase {
    return this.phase
  }

  private startPractice(): void {
    this.phase = 'practice'
    this.gameStarted = true
    this.gameOver = false
    this.score = 0
    this.obstacles = []
    this.currentSpeed = this.mechanics.obstacleSpeed
    this.currentGap = this.mechanics.gapHeight
    this.currentSpawnInterval = this.mechanics.spawnInterval
    this.santa.y = GAME_CONFIG.HEIGHT / 2
    this.santa.velocity = this.mechanics.jumpForce // First jump
    this.cameraOffset = 0
    this.previewObstacle = null

    this.practiceStartTime = Date.now()
    this.onScoreUpdate(0)
    this.practiceLoop()
  }

  public start(): void {
    if (this.gameStarted) return
    this.startPractice()
  }

  public reset(): void {
    this.obstacles = []
    this.score = 0
    this.gameOver = false
    this.gameStarted = false
    this.phase = 'idle'
    this.currentSpeed = this.mechanics.obstacleSpeed
    this.currentGap = this.mechanics.gapHeight
    this.currentSpawnInterval = this.mechanics.spawnInterval  // Reset spawn interval
    this.lastObstacleTime = 0
    this.lastSpeedIncrement = 0
    this.santa.y = GAME_CONFIG.HEIGHT / 2
    this.santa.velocity = 0
    this.cameraOffset = 0
    this.previewObstacle = null

    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }

    this.drawStartScreen()
  }

  private endGame(): void {
    this.gameOver = true
    this.gameStarted = false
    this.phase = 'gameover'

    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }

    this.onGameOver(this.score)
  }

  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }

  public isGameOver(): boolean {
    return this.gameOver
  }

  public getScore(): number {
    return this.score
  }
}
