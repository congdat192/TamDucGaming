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
  private currentSpeed: number = GAME_CONFIG.OBSTACLE_SPEED
  private currentGap: number = GAME_CONFIG.GAP_HEIGHT
  private currentSpawnInterval: number = GAME_CONFIG.OBSTACLE_SPAWN_INTERVAL  // Dynamic spawn interval
  private cameraOffset: number = 0  // For slide effect
  private previewObstacle: Obstacle | null = null  // Show obstacle during countdown
  private onScoreUpdate: (score: number) => void
  private onGameOver: (finalScore: number) => void

  constructor(
    canvas: HTMLCanvasElement,
    onScoreUpdate: (score: number) => void,
    onGameOver: (finalScore: number) => void
  ) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.onScoreUpdate = onScoreUpdate
    this.onGameOver = onGameOver

    // Set canvas size
    this.canvas.width = GAME_CONFIG.WIDTH
    this.canvas.height = GAME_CONFIG.HEIGHT

    // Initialize Santa
    this.santa = {
      x: GAME_CONFIG.SANTA_X,
      y: GAME_CONFIG.HEIGHT / 2,
      velocity: 0,
      width: GAME_CONFIG.SANTA_WIDTH,
      height: GAME_CONFIG.SANTA_HEIGHT
    }

    // Initialize snowflakes
    this.initSnowflakes()

    // Draw initial state
    this.drawStartScreen()
  }

  private initSnowflakes(): void {
    for (let i = 0; i < 50; i++) {
      this.snowflakes.push({
        x: Math.random() * GAME_CONFIG.WIDTH,
        y: Math.random() * GAME_CONFIG.HEIGHT,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 1
      })
    }
  }

  private drawStartScreen(): void {
    this.drawBackground()
    this.drawSnow()
    this.drawGround()
    this.drawSanta()

    // Text is now handled by React overlay in GameCanvas component
  }

  private drawBackground(): void {
    // Night sky gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.HEIGHT)
    gradient.addColorStop(0, '#0f172a')
    gradient.addColorStop(0.5, '#1e3a5f')
    gradient.addColorStop(1, '#2d4a6f')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT)

    // Stars
    this.ctx.fillStyle = '#FFFFFF'
    for (let i = 0; i < 30; i++) {
      const x = (i * 37) % GAME_CONFIG.WIDTH
      const y = (i * 23) % (GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT - 100)
      const size = (i % 3) + 1
      this.ctx.beginPath()
      this.ctx.arc(x, y, size, 0, Math.PI * 2)
      this.ctx.fill()
    }

    // Moon
    this.ctx.fillStyle = '#FFF8DC'
    this.ctx.beginPath()
    this.ctx.arc(GAME_CONFIG.WIDTH - 60, 60, 30, 0, Math.PI * 2)
    this.ctx.fill()
  }

  private drawSnow(): void {
    this.ctx.fillStyle = '#FFFFFF'
    for (const flake of this.snowflakes) {
      this.ctx.beginPath()
      this.ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2)
      this.ctx.fill()

      // Update position
      flake.y += flake.speed
      flake.x += Math.sin(flake.y * 0.01) * 0.5

      if (flake.y > GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT) {
        flake.y = 0
        flake.x = Math.random() * GAME_CONFIG.WIDTH
      }
    }
  }

  private drawGround(): void {
    const groundY = GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT

    // Snow layer
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.fillRect(0, groundY, GAME_CONFIG.WIDTH, 20)

    // Grass/ground
    this.ctx.fillStyle = COLORS.christmas.green
    this.ctx.fillRect(0, groundY + 20, GAME_CONFIG.WIDTH, GAME_CONFIG.GROUND_HEIGHT - 20)

    // Snow bumps
    this.ctx.fillStyle = '#FFFFFF'
    for (let i = 0; i < GAME_CONFIG.WIDTH; i += 40) {
      this.ctx.beginPath()
      this.ctx.arc(i + 20, groundY + 10, 15, Math.PI, 0)
      this.ctx.fill()
    }

    // Branding text
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    this.ctx.font = 'bold 12px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('Mắt Kính Tâm Đức - matkinhtamduc.com', GAME_CONFIG.WIDTH / 2, groundY + 45)

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    this.ctx.font = '10px Arial'
    this.ctx.fillText('By Chief Everything Officer', GAME_CONFIG.WIDTH / 2, groundY + 60)
  }

  private drawSanta(): void {
    const { x, y, width, height } = this.santa
    const ctx = this.ctx

    // Body (red suit)
    ctx.fillStyle = COLORS.christmas.red
    ctx.beginPath()
    ctx.ellipse(x + width / 2, y + height * 0.6, width * 0.4, height * 0.35, 0, 0, Math.PI * 2)
    ctx.fill()

    // Belt
    ctx.fillStyle = '#000000'
    ctx.fillRect(x + width * 0.15, y + height * 0.55, width * 0.7, height * 0.1)
    ctx.fillStyle = COLORS.christmas.gold
    ctx.fillRect(x + width * 0.35, y + height * 0.53, width * 0.3, height * 0.14)

    // Head
    ctx.fillStyle = '#FFE4C4'
    ctx.beginPath()
    ctx.arc(x + width / 2, y + height * 0.25, width * 0.3, 0, Math.PI * 2)
    ctx.fill()

    // Hat
    ctx.fillStyle = COLORS.christmas.red
    ctx.beginPath()
    ctx.moveTo(x + width * 0.2, y + height * 0.2)
    ctx.lineTo(x + width / 2, y - height * 0.2)
    ctx.lineTo(x + width * 0.8, y + height * 0.2)
    ctx.closePath()
    ctx.fill()

    // Hat brim
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(x + width * 0.15, y + height * 0.15, width * 0.7, height * 0.1)

    // Hat ball
    ctx.beginPath()
    ctx.arc(x + width / 2, y - height * 0.15, width * 0.1, 0, Math.PI * 2)
    ctx.fill()

    // Beard
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.ellipse(x + width / 2, y + height * 0.4, width * 0.25, height * 0.2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Eyes
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(x + width * 0.38, y + height * 0.22, 3, 0, Math.PI * 2)
    ctx.arc(x + width * 0.62, y + height * 0.22, 3, 0, Math.PI * 2)
    ctx.fill()

    // Cheeks
    ctx.fillStyle = '#FFB6C1'
    ctx.beginPath()
    ctx.arc(x + width * 0.25, y + height * 0.3, 5, 0, Math.PI * 2)
    ctx.arc(x + width * 0.75, y + height * 0.3, 5, 0, Math.PI * 2)
    ctx.fill()

    // Legs
    ctx.fillStyle = COLORS.christmas.red
    ctx.fillRect(x + width * 0.25, y + height * 0.8, width * 0.15, height * 0.2)
    ctx.fillRect(x + width * 0.6, y + height * 0.8, width * 0.15, height * 0.2)

    // Boots
    ctx.fillStyle = '#000000'
    ctx.fillRect(x + width * 0.2, y + height * 0.92, width * 0.25, height * 0.1)
    ctx.fillRect(x + width * 0.55, y + height * 0.92, width * 0.25, height * 0.1)
  }

  private drawObstacle(obstacle: Obstacle): void {
    const { x, topHeight, bottomY } = obstacle
    const width = GAME_CONFIG.OBSTACLE_WIDTH

    // Draw chimney style obstacles
    this.drawChimney(x, 0, width, topHeight, true)
    this.drawChimney(x, bottomY, width, GAME_CONFIG.HEIGHT - bottomY - GAME_CONFIG.GROUND_HEIGHT, false)
  }

  private drawChimney(x: number, y: number, width: number, height: number, flipped: boolean): void {
    const ctx = this.ctx

    if (height <= 0) return

    // Main chimney body
    ctx.fillStyle = COLORS.christmas.brick
    ctx.fillRect(x, y, width, height)

    // Brick pattern
    ctx.strokeStyle = '#5C3317'
    ctx.lineWidth = 2
    const brickHeight = 20
    const brickWidth = width / 2

    for (let row = 0; row < height / brickHeight; row++) {
      const offsetX = row % 2 === 0 ? 0 : brickWidth / 2
      for (let col = -1; col < 3; col++) {
        const bx = x + offsetX + col * brickWidth
        const by = y + row * brickHeight
        if (by >= y && by + brickHeight <= y + height) {
          ctx.strokeRect(bx, by, brickWidth, brickHeight)
        }
      }
    }

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

  private updateObstacles(): void {
    const now = Date.now()

    // Spawn new obstacle (using dynamic spawn interval)
    if (now - this.lastObstacleTime > this.currentSpawnInterval) {
      const minHeight = GAME_CONFIG.MIN_OBSTACLE_HEIGHT
      const maxHeight = GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT - this.currentGap - minHeight
      const topHeight = Math.random() * (maxHeight - minHeight) + minHeight

      this.obstacles.push({
        x: GAME_CONFIG.WIDTH,
        topHeight,
        bottomY: topHeight + this.currentGap,
        passed: false
      })

      this.lastObstacleTime = now
    }

    // Update obstacle positions
    for (const obstacle of this.obstacles) {
      obstacle.x -= this.currentSpeed

      if (!obstacle.passed && obstacle.x + GAME_CONFIG.OBSTACLE_WIDTH < this.santa.x) {
        obstacle.passed = true
        this.score++
        this.onScoreUpdate(this.score)
      }
    }

    // Remove off-screen obstacles
    this.obstacles = this.obstacles.filter(o => o.x > -GAME_CONFIG.OBSTACLE_WIDTH)

    // Increase difficulty progressively
    if (now - this.lastSpeedIncrement > GAME_CONFIG.SPEED_INCREMENT_INTERVAL) {
      // Increase speed
      if (this.currentSpeed < GAME_CONFIG.MAX_SPEED) {
        this.currentSpeed += GAME_CONFIG.SPEED_INCREMENT
      }
      // Decrease gap (make it harder)
      if (this.currentGap > GAME_CONFIG.MIN_GAP) {
        this.currentGap -= GAME_CONFIG.GAP_DECREASE
      }
      // Decrease spawn interval (obstacles appear more frequently)
      if (this.currentSpawnInterval > GAME_CONFIG.MIN_SPAWN_INTERVAL) {
        this.currentSpawnInterval -= GAME_CONFIG.SPAWN_INTERVAL_DECREASE
        this.currentSpawnInterval = Math.max(this.currentSpawnInterval, GAME_CONFIG.MIN_SPAWN_INTERVAL)
      }
      this.lastSpeedIncrement = now
    }
  }

  private checkCollision(): boolean {
    const santa = this.santa
    const santaBox = {
      left: santa.x + 10,
      right: santa.x + santa.width - 10,
      top: santa.y + 5,
      bottom: santa.y + santa.height - 5
    }

    // Ground collision
    if (santaBox.bottom > GAME_CONFIG.HEIGHT - GAME_CONFIG.GROUND_HEIGHT) {
      return true
    }

    // Ceiling collision
    if (santaBox.top < 0) {
      return true
    }

    // Obstacle collision
    for (const obstacle of this.obstacles) {
      const obsLeft = obstacle.x
      const obsRight = obstacle.x + GAME_CONFIG.OBSTACLE_WIDTH

      if (santaBox.right > obsLeft && santaBox.left < obsRight) {
        if (santaBox.top < obstacle.topHeight) {
          return true
        }
        if (santaBox.bottom > obstacle.bottomY) {
          return true
        }
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
    this.drawSnow()

    // Update Santa physics (with ground boundary)
    this.santa.velocity += GAME_CONFIG.GRAVITY
    this.santa.velocity = Math.min(this.santa.velocity, GAME_CONFIG.MAX_FALL_SPEED)
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
    this.drawSnow()

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
    this.santa.velocity += GAME_CONFIG.GRAVITY
    this.santa.velocity = Math.min(this.santa.velocity, GAME_CONFIG.MAX_FALL_SPEED)
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

    // Clear canvas
    this.ctx.clearRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT)

    // Draw background elements
    this.drawBackground()
    this.drawSnow()

    // Update Santa physics
    this.santa.velocity += GAME_CONFIG.GRAVITY
    this.santa.velocity = Math.min(this.santa.velocity, GAME_CONFIG.MAX_FALL_SPEED)
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

  public jump(): void {
    if (this.gameOver) return

    if (this.phase === 'idle') {
      this.startPractice()
      return
    }

    // Allow jumping during practice, countdown, and playing
    if (this.phase === 'practice' || this.phase === 'countdown' || this.phase === 'playing') {
      this.santa.velocity = GAME_CONFIG.JUMP_FORCE
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
    this.currentSpeed = GAME_CONFIG.OBSTACLE_SPEED
    this.currentGap = GAME_CONFIG.GAP_HEIGHT
    this.santa.y = GAME_CONFIG.HEIGHT / 2
    this.santa.velocity = GAME_CONFIG.JUMP_FORCE // First jump
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
    this.currentSpeed = GAME_CONFIG.OBSTACLE_SPEED
    this.currentGap = GAME_CONFIG.GAP_HEIGHT
    this.currentSpawnInterval = GAME_CONFIG.OBSTACLE_SPAWN_INTERVAL  // Reset spawn interval
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
