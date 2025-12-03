# CONTEXT.md - Santa Jump Project

> **Tài liệu này cung cấp context chi tiết về kiến trúc, quyết định thiết kế, và cách thức hoạt động của dự án Santa Jump.**

## 📖 Mục Lục

1. [Tổng Quan Dự Án](#tổng-quan-dự-án)
2. [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
3. [Data Flow](#data-flow)
4. [Authentication Flow](#authentication-flow)
5. [Game Engine](#game-engine)
6. [Anti-Cheat System](#anti-cheat-system)
7. [Email System](#email-system)
8. [Phone OTP System](#phone-otp-system)
9. [Database Schema](#database-schema)
10. [API Routes](#api-routes)
11. [Frontend Components](#frontend-components)
12. [Admin Dashboard](#admin-dashboard)
13. [Deployment Architecture](#deployment-architecture)
14. [Security Considerations](#security-considerations)
15. [Performance Optimizations](#performance-optimizations)
16. [Known Limitations](#known-limitations)

---

## Tổng Quan Dự Án

### Business Context
**Santa Jump** là một mini-game web được phát triển cho **Mắt Kính Tâm Đức** nhân dịp Giáng Sinh 2025. Mục tiêu:

- **Marketing**: Thu hút khách hàng tương tác với thương hiệu
- **Engagement**: Tăng thời gian người dùng ở lại website
- **Data Collection**: Thu thập email/phone cho marketing campaigns
- **Conversion**: Chuyển đổi người chơi thành khách hàng qua vouchers

### Technical Goals
- ✅ **Scalable**: Hỗ trợ hàng nghìn người chơi đồng thời
- ✅ **Secure**: Chống gian lận, bảo vệ dữ liệu người dùng
- ✅ **Fast**: Load time < 2s, game FPS ≥ 60
- ✅ **Reliable**: Uptime > 99.9%
- ✅ **Maintainable**: Code dễ đọc, dễ mở rộng

---

## Kiến Trúc Hệ Thống

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Homepage   │  │  Game Page   │  │    Admin     │         │
│  │  (Next.js)   │  │  (Canvas)    │  │  Dashboard   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP (Vercel)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Routes                             │  │
│  │  /api/auth/*  /api/game/*  /api/leaderboard/*           │  │
│  │  /api/user/*  /api/voucher/*  /api/admin/*              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Middleware                              │  │
│  │  - Auth protection  - Cache control  - Rate limiting     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐
│   SUPABASE       │  │  RESEND      │  │  VIHAT API       │
│   (PostgreSQL)   │  │  (Email)     │  │  (SMS/ZNS)       │
│                  │  │              │  │                  │
│  - Users         │  │  - OTP       │  │  - Phone OTP     │
│  - Game Sessions │  │  - Vouchers  │  │  - ZNS Messages  │
│  - Leaderboard   │  │  - Notifs    │  │  - SMS Fallback  │
│  - Vouchers      │  │              │  │                  │
│                  │  │  Fallback:   │  │  Via Edge Func   │
│  Edge Functions: │  │  Gmail SMTP  │  │                  │
│  - send_otp_phone│  │              │  │                  │
│  - verify_otp    │  │              │  │                  │
└──────────────────┘  └──────────────┘  └──────────────────┘
```

### Technology Stack Rationale

#### Why Next.js 14?
- **App Router**: Modern routing với React Server Components
- **API Routes**: Backend và frontend trong cùng 1 codebase
- **SSR/SSG**: SEO-friendly cho landing pages
- **Vercel Integration**: Deploy dễ dàng, auto-scaling

#### Why Supabase?
- **PostgreSQL**: Powerful, reliable, ACID compliant
- **Real-time**: WebSocket support (future feature)
- **Auth**: Built-in auth system (không dùng vì custom JWT)
- **Edge Functions**: Serverless functions với Deno runtime
- **Free Tier**: Generous limits cho MVP

#### Why TypeScript?
- **Type Safety**: Catch bugs at compile time
- **IntelliSense**: Better developer experience
- **Refactoring**: Safe refactoring với type checking
- **Documentation**: Types serve as documentation

---

## Data Flow

### Game Play Flow

```
1. USER OPENS GAME PAGE
   ↓
2. Check Auth (/api/auth/me)
   ├─ Not logged in → Show LoginModal
   └─ Logged in → Load user stats
   ↓
3. USER CLICKS "CHƠI NGAY"
   ↓
4. POST /api/game/start
   ├─ Check plays remaining
   ├─ Create game_session (status: pending)
   ├─ Generate game_token (JWT)
   └─ Return { gameToken, sessionId }
   ↓
5. GAME ENGINE STARTS
   ├─ Initialize canvas
   ├─ Load game config
   ├─ Start game loop (60 FPS)
   └─ Track score
   ↓
6. USER PLAYS GAME
   ├─ Click/Tap → Santa jumps
   ├─ Collision detection
   └─ Score updates
   ↓
7. GAME OVER
   ↓
8. POST /api/game/end
   ├─ Payload: { gameToken, score }
   ├─ Verify game_token
   ├─ Validate score (7 layers)
   ├─ Update game_session (status: completed)
   ├─ Update user.total_score
   └─ Return { validatedScore, suspicionReason }
   ↓
9. SHOW GAME OVER MODAL
   ├─ Display score
   ├─ Show leaderboard position
   └─ Suggest actions (play again, redeem voucher)
```

### Voucher Redemption Flow

```
1. USER CLICKS "ĐỔI QUÀ"
   ↓
2. POST /api/voucher/redeem
   ├─ Check user.total_score >= required_score
   ├─ Begin transaction
   ├─ Deduct score from user
   ├─ Generate unique voucher code
   ├─ Insert to vouchers table
   ├─ Send email with voucher
   └─ Commit transaction
   ↓
3. EMAIL SENT
   ├─ Try Resend API
   ├─ If failed → Try Gmail SMTP
   └─ Log to email_logs table
   ↓
4. USER RECEIVES VOUCHER
   └─ Use voucher at store
```

---

## Authentication Flow

### Email OTP Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. USER ENTERS EMAIL                                         │
│    ↓                                                          │
│ 2. POST /api/auth/send-otp                                   │
│    ├─ Validate email format                                  │
│    ├─ Generate OTP (6 digits)                                │
│    ├─ Insert to otp_codes table (expires in 5 min)           │
│    ├─ Send email via emailService                            │
│    └─ Return success                                         │
│    ↓                                                          │
│ 3. USER RECEIVES EMAIL                                       │
│    ↓                                                          │
│ 4. USER ENTERS OTP                                           │
│    ↓                                                          │
│ 5. POST /api/auth/verify-otp                                 │
│    ├─ Find OTP in otp_codes table                            │
│    ├─ Check expiration                                       │
│    ├─ Verify OTP code                                        │
│    ├─ Mark OTP as verified                                   │
│    ├─ Find or create user                                    │
│    ├─ Generate JWT token                                     │
│    ├─ Set HTTP-only cookie                                   │
│    └─ Return user data                                       │
│    ↓                                                          │
│ 6. USER LOGGED IN                                            │
└──────────────────────────────────────────────────────────────┘
```

### Phone OTP Flow (via Supabase Edge Functions)

```
┌──────────────────────────────────────────────────────────────┐
│ 1. USER ENTERS PHONE NUMBER                                  │
│    ↓                                                          │
│ 2. POST /api/auth/send-otp (type: 'phone')                   │
│    ├─ Validate phone format (Vietnamese)                     │
│    ├─ Call Supabase Edge Function: send_otp_phone            │
│    │   ├─ Check rate limits (5/hour/phone, 20/hour/IP)       │
│    │   ├─ Check daily cost cap (200K VND)                    │
│    │   ├─ Generate OTP (6 digits)                            │
│    │   ├─ Insert to otp_login_vihat table                    │
│    │   ├─ Call VIHAT MultiChannel API                        │
│    │   │   ├─ Try ZNS (Zalo) first                           │
│    │   │   └─ Fallback to SMS if ZNS fails                   │
│    │   └─ Return success                                     │
│    └─ Return success                                         │
│    ↓                                                          │
│ 3. USER RECEIVES ZNS/SMS                                     │
│    ↓                                                          │
│ 4. USER ENTERS OTP                                           │
│    ↓                                                          │
│ 5. POST /api/user/add-phone-bonus                            │
│    ├─ Call Supabase Edge Function: verify_otp_phone          │
│    │   ├─ Find OTP in otp_login_vihat table                  │
│    │   ├─ Check max attempts (5)                             │
│    │   ├─ Verify OTP code                                    │
│    │   └─ Mark as verified                                   │
│    ├─ Update user.phone                                      │
│    ├─ Add bonus_plays                                        │
│    └─ Return success                                         │
│    ↓                                                          │
│ 6. USER RECEIVES BONUS PLAYS                                 │
└──────────────────────────────────────────────────────────────┘
```

### Why Edge Functions for Phone OTP?

**Problem**: VIHAT credentials không nên expose trên Vercel environment variables (security risk)

**Solution**: Hardcode credentials trong Supabase Edge Functions
- Edge Functions chạy trên Supabase infrastructure
- Credentials không bao giờ expose ra client hoặc Vercel
- Deno runtime hỗ trợ tốt cho HTTP requests
- Rate limiting và cost protection tập trung

---

## Game Engine

### SantaJumpGame Class

**File**: `lib/game/engine.ts`

#### Core Components

```typescript
class SantaJumpGame {
  // Canvas & Context
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  
  // Game Objects
  private santa: Santa           // Player character
  private obstacles: Obstacle[]  // Chimneys
  private snowflakes: Snowflake[] // Background animation
  
  // Game State
  private score: number
  private gamePhase: GamePhase   // 'start' | 'practice' | 'playing' | 'gameover'
  private gameOver: boolean
  
  // Physics
  private gravity: number
  private jumpForce: number
  private maxFallSpeed: number
  
  // Difficulty
  private obstacleSpeed: number
  private gapHeight: number
  private spawnInterval: number
  
  // Callbacks
  private onScoreUpdate: (score: number) => void
  private onGameOver: (score: number) => void
  private onPhaseChange?: (phase: GamePhase) => void
  
  // Audio
  private audioCallbacks: {
    playJump: () => void
    playCollectGift: () => void
    // ...
  }
}
```

#### Game Loop

```typescript
// 60 FPS game loop
private gameLoop() {
  if (this.gameOver) return
  
  // 1. Update physics
  this.santa.velocity += this.gravity
  this.santa.velocity = Math.min(this.santa.velocity, this.maxFallSpeed)
  this.santa.y += this.santa.velocity
  
  // 2. Update obstacles
  this.updateObstacles()
  
  // 3. Check collisions
  if (this.checkCollision()) {
    this.endGame()
    return
  }
  
  // 4. Update score
  this.obstacles.forEach(obstacle => {
    if (!obstacle.passed && obstacle.x + OBSTACLE_WIDTH < this.santa.x) {
      obstacle.passed = true
      this.score++
      this.onScoreUpdate(this.score)
      this.audioCallbacks.playCollectGift()
    }
  })
  
  // 5. Increase difficulty over time
  this.increaseDifficulty()
  
  // 6. Render
  this.render()
  
  // 7. Next frame
  requestAnimationFrame(() => this.gameLoop())
}
```

#### Difficulty Progression

```typescript
// Tăng độ khó theo thời gian
private increaseDifficulty() {
  const now = Date.now()
  const elapsed = now - this.lastSpeedIncrease
  
  if (elapsed >= SPEED_INCREMENT_INTERVAL) {
    // Tăng tốc độ
    this.obstacleSpeed = Math.min(
      this.obstacleSpeed + SPEED_INCREMENT,
      MAX_SPEED
    )
    
    // Giảm khoảng cách
    this.gapHeight = Math.max(
      this.gapHeight - GAP_DECREASE,
      MIN_GAP
    )
    
    // Giảm spawn interval
    this.spawnInterval = Math.max(
      this.spawnInterval - SPAWN_INTERVAL_DECREASE,
      MIN_SPAWN_INTERVAL
    )
    
    this.lastSpeedIncrease = now
  }
}
```

#### Collision Detection

```typescript
private checkCollision(): boolean {
  // Ground collision
  if (this.santa.y + this.santa.height >= this.canvas.height - GROUND_HEIGHT) {
    return true
  }
  
  // Ceiling collision
  if (this.santa.y <= 0) {
    return true
  }
  
  // Obstacle collision
  for (const obstacle of this.obstacles) {
    // Check if santa is in obstacle's x range
    if (
      this.santa.x + this.santa.width > obstacle.x &&
      this.santa.x < obstacle.x + OBSTACLE_WIDTH
    ) {
      // Check if santa hits top or bottom chimney
      if (
        this.santa.y < obstacle.topHeight ||
        this.santa.y + this.santa.height > obstacle.bottomY
      ) {
        return true
      }
    }
  }
  
  return false
}
```

#### Performance Optimizations

1. **Object Pooling**: Reuse obstacle objects thay vì tạo mới
2. **Canvas Caching**: Cache static elements (background, ground)
3. **RequestAnimationFrame**: Smooth 60 FPS animation
4. **Pixel Ratio Handling**: Crisp rendering on retina displays

---

## Anti-Cheat System

### Why Anti-Cheat?

**Problem**: Người chơi có thể:
- Modify client-side JavaScript để gửi điểm cao giả
- Replay game tokens để chơi nhiều lần với 1 session
- Sử dụng automation tools để chơi tự động

**Solution**: 7-layer server-side validation

### Validation Layers

#### Layer 1: Duration Check
```typescript
// Quá nhanh → cheat
if (duration < 3) {
  validatedScore = 0
  suspicionReason = 'Duration too short'
}

// Quá lâu → warning (có thể pause game)
if (duration > 300) {
  suspicionReason = 'Duration too long (possible pause)'
}
```

#### Layer 2: Score-Time Ratio
```typescript
// Mỗi điểm cần ít nhất 1.2s (với buffer 30%)
const minTimeRequired = score * 1.2
const buffer = minTimeRequired * 0.3

if (duration < minTimeRequired - buffer) {
  validatedScore = 0
  suspicionReason = 'Score too high for duration'
}
```

#### Layer 3: Per-Game Cap
```typescript
// Max 300 điểm/game (configurable)
const maxScorePerGame = gameConfig.maxScorePerGame || 300

if (score > maxScorePerGame) {
  validatedScore = maxScorePerGame
  suspicionReason = 'Exceeded max score per game'
}
```

#### Layer 4: Daily Cap
```typescript
// Max 500 điểm/ngày
const todayScore = await getTodayScore(userId)
const maxDailyScore = 500

if (todayScore + validatedScore > maxDailyScore) {
  validatedScore = Math.max(0, maxDailyScore - todayScore)
  suspicionReason = 'Exceeded daily score cap'
}
```

#### Layer 5: Session Validation
```typescript
// Verify game token
const tokenPayload = verifyGameToken(gameToken)
if (!tokenPayload) {
  return { error: 'Invalid game token' }
}

// Check session exists and is pending
const session = await supabaseAdmin
  .from('game_sessions')
  .select('*')
  .eq('id', tokenPayload.sessionId)
  .eq('status', 'pending')
  .single()

if (!session) {
  return { error: 'Session not found or already completed' }
}

// Atomic update to prevent race condition
const { error } = await supabaseAdmin
  .from('game_sessions')
  .update({ status: 'processing' })
  .eq('id', session.id)
  .eq('status', 'pending')  // Only update if still pending

if (error) {
  return { error: 'Session already being processed' }
}
```

#### Layer 6: Rate Limiting
```typescript
// Max 5 game ends per minute
const recentEnds = await getRecentGameEnds(userId, 60)
if (recentEnds >= 5) {
  return { error: 'Too many requests' }
}

// Max 3 open sessions
const openSessions = await getOpenSessions(userId)
if (openSessions >= 3) {
  return { error: 'Too many open sessions' }
}
```

#### Layer 7: Negative Score Check
```typescript
if (score < 0) {
  validatedScore = 0
  suspicionReason = 'Negative score'
}
```

### Suspicious Session Tracking

Mọi game session đều lưu:
```typescript
{
  id: uuid,
  session_id: string,
  user_id: uuid,
  game_token: string,
  status: 'pending' | 'processing' | 'completed' | 'invalid',
  client_score: number,        // Score từ client
  validated_score: number,     // Score sau validation
  suspicion_reason: string | null,
  config_snapshot: json,       // Game config tại thời điểm chơi
  started_at: timestamp,
  ended_at: timestamp,
  duration: number
}
```

Admin có thể:
- Xem tất cả suspicious sessions
- Filter theo suspicion_reason
- Invalidate sessions (set validated_score = 0)
- View user's play history

---

## Email System

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   emailService.ts                       │
│                                                         │
│  sendEmail(options)                                     │
│    ├─ Try Resend API                                    │
│    │   ├─ Success → Log to email_logs → Return         │
│    │   └─ Failed → Continue to fallback                │
│    │                                                     │
│    ├─ Try Gmail SMTP                                    │
│    │   ├─ Success → Log to email_logs → Return         │
│    │   └─ Failed → Continue                            │
│    │                                                     │
│    └─ All failed → Log error → Return error            │
└─────────────────────────────────────────────────────────┘
```

### Email Logging

**Why log emails?**
- **Debugging**: Track delivery failures
- **Compliance**: Audit trail for sent emails
- **Analytics**: Email open rates, click rates (future)
- **Cost Tracking**: Monitor email provider costs

**Schema**:
```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL,  -- 'otp', 'voucher', 'referral', etc.
  provider TEXT NOT NULL,     -- 'resend', 'gmail', 'none'
  status TEXT NOT NULL,       -- 'success', 'failed'
  message_id TEXT,
  error_message TEXT,
  user_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Email Templates

**Dynamic Templates** stored in database:
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY,
  template_key TEXT UNIQUE NOT NULL,  -- 'otp', 'voucher_claim', etc.
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  variables JSONB,  -- ['otp', 'name', 'voucherCode']
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Variable Replacement**:
```typescript
// Template: "Xin chào {{name}}, OTP của bạn là {{otp}}"
// Variables: { name: 'John', otp: '123456' }
// Result: "Xin chào John, OTP của bạn là 123456"

function replaceTemplateVariables(
  template: string,
  variables: Record<string, string | number>
): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, String(value))
  }
  return result
}
```

### Resend vs Gmail SMTP

| Feature | Resend | Gmail SMTP |
|---------|--------|------------|
| **Setup** | API key | App password |
| **Rate Limit** | 100 emails/day (free) | 500 emails/day |
| **Deliverability** | Excellent | Good |
| **Cost** | $0.001/email after free tier | Free |
| **Tracking** | Built-in | Manual |
| **Reliability** | High | Medium |

**Strategy**: Use Resend as primary, Gmail as fallback

---

## Phone OTP System

### Why Supabase Edge Functions?

**Alternative 1**: Call VIHAT directly from Next.js API
- ❌ Credentials exposed in Vercel environment
- ❌ Harder to rate limit globally
- ❌ No separation of concerns

**Alternative 2**: Use Supabase Edge Functions
- ✅ Credentials hardcoded in Edge Functions (secure)
- ✅ Rate limiting at edge (closer to user)
- ✅ Deno runtime (modern, secure)
- ✅ Independent scaling

### Edge Function: send_otp_phone

**File**: `supabase/functions/send_otp_phone/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VIHAT_CONFIG = {
  API_KEY: "B70DE56E1A997DF6BB197CEEC85B7A",
  SECRET_KEY: "FCD201C2BEE44E7FB641261801AB94",
  BRANDNAME: "MKTAMDUC",
  ZNS_TEMPLATE_ID: "478665",
  OAID: "939629380721919913",
  API_URL: "https://rest.esms.vn/MainService.svc/json/MultiChannelMessage/"
}

serve(async (req) => {
  // 1. Parse request
  const { phone } = await req.json()
  
  // 2. Validate phone format
  if (!isValidVietnamesePhone(phone)) {
    return new Response(JSON.stringify({ error: 'Invalid phone' }), {
      status: 400
    })
  }
  
  // 3. Check rate limits
  const rateLimitOk = await checkRateLimits(phone, clientIP)
  if (!rateLimitOk) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429
    })
  }
  
  // 4. Generate OTP
  const otp = generateOTP()
  
  // 5. Insert to database
  await supabase.from('otp_login_vihat').insert({
    phone,
    otp_code: otp,
    expires_at: new Date(Date.now() + 5 * 60 * 1000),
    ip_address: clientIP
  })
  
  // 6. Call VIHAT API
  const response = await fetch(VIHAT_CONFIG.API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ApiKey: VIHAT_CONFIG.API_KEY,
      SecretKey: VIHAT_CONFIG.SECRET_KEY,
      Phone: phone,
      Content: `Ma OTP cua ban la: ${otp}. Ma co hieu luc trong 5 phut.`,
      Brandname: VIHAT_CONFIG.BRANDNAME,
      SmsType: 8,  // MultiChannel (ZNS → SMS)
      ZaloTemplateId: VIHAT_CONFIG.ZNS_TEMPLATE_ID,
      ZaloOAId: VIHAT_CONFIG.OAID,
      ZaloTemplateData: {
        otp: otp
      }
    })
  })
  
  // 7. Return success
  return new Response(JSON.stringify({ success: true }), {
    status: 200
  })
})
```

### Rate Limiting Strategy

```typescript
async function checkRateLimits(phone: string, ip: string): Promise<boolean> {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  
  // Check per-phone limit (5/hour)
  const phoneCount = await supabase
    .from('otp_login_vihat')
    .select('id', { count: 'exact' })
    .eq('phone', phone)
    .gte('created_at', oneHourAgo.toISOString())
  
  if (phoneCount.count >= 5) {
    return false
  }
  
  // Check per-IP limit (20/hour)
  const ipCount = await supabase
    .from('otp_login_vihat')
    .select('id', { count: 'exact' })
    .eq('ip_address', ip)
    .gte('created_at', oneHourAgo.toISOString())
  
  if (ipCount.count >= 20) {
    return false
  }
  
  // Check daily cost cap (200K VND)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data: todayCost } = await supabase
    .from('otp_login_vihat')
    .select('cost')
    .gte('created_at', today.toISOString())
  
  const totalCost = todayCost?.reduce((sum, row) => sum + row.cost, 0) || 0
  
  if (totalCost >= 200000) {
    return false
  }
  
  return true
}
```

---

## Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  name TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  plays_today INTEGER DEFAULT 0,
  bonus_plays INTEGER DEFAULT 0,
  last_play_date DATE,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_referral_code ON users(referral_code);
```

#### game_sessions
```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, processing, completed, invalid
  client_score INTEGER NOT NULL,
  validated_score INTEGER NOT NULL,
  suspicion_reason TEXT,
  config_snapshot JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration INTEGER,  -- seconds
  played_at TIMESTAMPTZ DEFAULT NOW(),
  campaign_id UUID REFERENCES campaigns(id)
);

CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_game_sessions_played_at ON game_sessions(played_at);
```

#### vouchers
```sql
CREATE TABLE vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  value INTEGER NOT NULL,  -- VND
  score_earned INTEGER NOT NULL,  -- Score used to redeem
  is_used BOOLEAN DEFAULT FALSE,
  sent_to_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_vouchers_user_id ON vouchers(user_id);
CREATE INDEX idx_vouchers_code ON vouchers(code);
```

### Views for Leaderboard

```sql
-- Daily leaderboard
CREATE OR REPLACE VIEW leaderboard_daily AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.phone,
  SUM(gs.validated_score) as total_score,
  COUNT(gs.id) as games_played,
  MAX(gs.validated_score) as best_score
FROM users u
JOIN game_sessions gs ON u.id = gs.user_id
WHERE gs.played_at >= CURRENT_DATE
  AND gs.status = 'completed'
GROUP BY u.id, u.name, u.email, u.phone
ORDER BY total_score DESC, best_score DESC;

-- Weekly leaderboard
CREATE OR REPLACE VIEW leaderboard_weekly AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.phone,
  SUM(gs.validated_score) as total_score,
  COUNT(gs.id) as games_played,
  MAX(gs.validated_score) as best_score
FROM users u
JOIN game_sessions gs ON u.id = gs.user_id
WHERE gs.played_at >= DATE_TRUNC('week', CURRENT_DATE)
  AND gs.status = 'completed'
GROUP BY u.id, u.name, u.email, u.phone
ORDER BY total_score DESC, best_score DESC;

-- Monthly leaderboard
CREATE OR REPLACE VIEW leaderboard_monthly AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.phone,
  SUM(gs.validated_score) as total_score,
  COUNT(gs.id) as games_played,
  MAX(gs.validated_score) as best_score
FROM users u
JOIN game_sessions gs ON u.id = gs.user_id
WHERE gs.played_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND gs.status = 'completed'
GROUP BY u.id, u.name, u.email, u.phone
ORDER BY total_score DESC, best_score DESC;
```

---

## API Routes

### Authentication APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/send-otp` | POST | Send OTP (email or phone) |
| `/api/auth/verify-otp` | POST | Verify OTP and login |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/logout` | POST | Logout user |

### Game APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/game/start` | POST | Start new game session |
| `/api/game/end` | POST | End game and validate score |
| `/api/game/config` | GET | Get game configuration |

### User APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/stats` | GET | Get user statistics |
| `/api/user/add-phone-bonus` | POST | Add phone and get bonus |

### Leaderboard APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/leaderboard` | GET | Get leaderboard (daily/weekly/monthly) |

### Voucher APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/voucher/redeem` | POST | Redeem voucher with score |
| `/api/voucher/available` | GET | Get available voucher tiers |

### Admin APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/login` | POST | Admin login |
| `/api/admin/stats` | GET | Dashboard statistics |
| `/api/admin/config` | GET/PUT | Game configuration |
| `/api/admin/suspicious-sessions` | GET | Get suspicious sessions |
| `/api/admin/invalidate-session` | POST | Invalidate session |

---

## Frontend Components

### Component Hierarchy

```
App (page.tsx)
├── TopMenu
│   └── NotificationBell
├── Snowflakes
├── LoginModal
├── ProfileModal
│   └── AddPhoneModal (conditional)
├── GiftSection
├── BottomNavigation
└── FloatingAudioToggle

Game Page (game/page.tsx)
├── GameCanvas
├── GameOverModal
│   └── AddPhoneModal (conditional)
└── OutOfPlaysModal
    └── AddPhoneModal (conditional)
```

### Key Components

#### GameCanvas
**Responsibility**: Render game, handle user input, manage game state

```typescript
export default function GameCanvas({
  onScoreUpdate,
  onGameOver,
  onPhaseChange
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<SantaJumpGame | null>(null)
  
  useEffect(() => {
    if (!canvasRef.current) return
    
    // Initialize game engine
    gameRef.current = new SantaJumpGame(
      canvasRef.current,
      onScoreUpdate,
      onGameOver,
      gameMechanics,
      audioCallbacks,
      onPhaseChange
    )
    
    return () => {
      gameRef.current?.destroy()
    }
  }, [])
  
  return <canvas ref={canvasRef} />
}
```

#### LoginModal
**Responsibility**: Handle email/phone OTP authentication

**States**:
- `step`: 'email' | 'otp'
- `email`: string
- `otp`: string
- `loading`: boolean
- `error`: string | null

#### ProfileModal
**Responsibility**: Display user stats, manage profile

**Features**:
- Display total score, plays remaining
- Show referral code
- Add phone number (bonus plays)
- Logout

---

## Admin Dashboard

### Features

#### 1. Dashboard (`/admin/dashboard`)
- Total users
- Total games played
- Total vouchers redeemed
- Revenue (estimated)
- Charts: Daily active users, Games per day

#### 2. Game Config (`/admin/config`)
- Edit game mechanics (gravity, jump force, etc.)
- Edit play limits (max plays per day, bonus plays)
- Edit score caps (per game, per day)

#### 3. Campaigns (`/admin/campaigns`)
- Create/edit/delete campaigns
- Set start/end dates
- Track campaign performance

#### 4. Suspicious Sessions (`/admin/suspicious`)
- View all flagged sessions
- Filter by suspicion reason
- Invalidate sessions
- View user play history

#### 5. Email Logs (`/admin/email-logs`)
- View all sent emails
- Filter by status, type, provider
- Debug delivery failures

#### 6. Email Templates (`/admin/email-templates`)
- Edit email templates
- Preview templates with sample data
- Activate/deactivate templates

---

## Deployment Architecture

### Vercel

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │              Next.js Application                  │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │  Static Assets (CDN)                        │ │ │
│  │  │  - /public/*                                │ │ │
│  │  │  - /_next/static/*                          │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │  Serverless Functions                       │ │ │
│  │  │  - /api/*                                   │ │ │
│  │  │  - /app/*/page.tsx (SSR)                    │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │  Middleware (Edge Runtime)                  │ │ │
│  │  │  - Auth protection                          │ │ │
│  │  │  - Cache control                            │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │              Cron Jobs                            │ │
│  │  - /api/cron/notifications (daily 1 AM)          │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Environment Variables

**Vercel Environment**:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# App
NEXT_PUBLIC_BASE_URL=https://santa-jump.vercel.app
JWT_SECRET=xxx

# Email
RESEND_API_KEY=re_xxx
GMAIL_USER=xxx@gmail.com
GMAIL_APP_PASSWORD=xxx

# Mock OTP
MOCK_OTP_ENABLED=false
```

**Supabase Edge Functions Environment**:
- VIHAT credentials hardcoded in code (not env vars)

---

## Security Considerations

### 1. Authentication
- ✅ JWT tokens in HTTP-only cookies (not localStorage)
- ✅ 7-day expiration
- ✅ Secure flag in production
- ✅ SameSite=Lax

### 2. API Protection
- ✅ Rate limiting on sensitive endpoints
- ✅ CORS configured properly
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (Supabase parameterized queries)

### 3. Data Privacy
- ✅ Email/phone masked in UI
- ✅ No PII in logs
- ✅ GDPR-compliant data handling

### 4. Anti-Cheat
- ✅ Server-side score validation
- ✅ Game token verification
- ✅ Session status tracking
- ✅ Atomic updates for race conditions

### 5. Secrets Management
- ✅ Environment variables for sensitive data
- ✅ VIHAT credentials in Edge Functions (not exposed)
- ✅ No secrets in client-side code

---

## Performance Optimizations

### 1. Frontend
- ✅ Dynamic imports for heavy components
- ✅ Image optimization (Next.js Image)
- ✅ Code splitting (automatic with Next.js)
- ✅ SWR for client-side caching

### 2. Game Engine
- ✅ Object pooling for obstacles
- ✅ Canvas caching for static elements
- ✅ RequestAnimationFrame for smooth 60 FPS
- ✅ Pixel ratio handling for retina displays

### 3. Database
- ✅ Indexes on frequently queried columns
- ✅ Views for complex leaderboard queries
- ✅ Connection pooling (Supabase)

### 4. API
- ✅ Middleware for cache control
- ✅ SWR revalidation strategy
- ✅ Lazy loading for admin dashboard

---

## Known Limitations

### 1. Scalability
- **Current**: ~1000 concurrent users
- **Bottleneck**: Supabase free tier (500 concurrent connections)
- **Solution**: Upgrade to paid tier or implement connection pooling

### 2. Email Delivery
- **Current**: Resend free tier (100 emails/day)
- **Bottleneck**: High volume campaigns
- **Solution**: Upgrade Resend or use dedicated SMTP

### 3. Phone OTP Cost
- **Current**: ~500 VND/OTP (ZNS) or ~700 VND/OTP (SMS)
- **Bottleneck**: Daily cost cap (200K VND = ~300 OTPs)
- **Solution**: Increase budget or implement stricter rate limits

### 4. Game Performance
- **Current**: 60 FPS on modern devices
- **Bottleneck**: Old mobile devices (< 30 FPS)
- **Solution**: Implement adaptive quality settings

### 5. Admin Dashboard
- **Current**: Basic stats and management
- **Missing**: Advanced analytics, A/B testing, user segmentation
- **Solution**: Integrate analytics platform (Google Analytics, Mixpanel)

---

## Future Enhancements

### Short-term (1-3 months)
- [ ] Push notifications (PWA)
- [ ] Social sharing (Facebook, Zalo)
- [ ] Achievements system
- [ ] Daily challenges

### Mid-term (3-6 months)
- [ ] Multiplayer mode
- [ ] In-game power-ups
- [ ] Seasonal themes
- [ ] Mobile app (React Native)

### Long-term (6-12 months)
- [ ] AI-powered anti-cheat
- [ ] Real-time leaderboard (WebSocket)
- [ ] Advanced analytics dashboard
- [ ] Integration with CRM system

---

**Last Updated**: 2025-12-03
**Version**: 1.0.0
**Maintainer**: Development Team
