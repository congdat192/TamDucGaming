# 🎅 Santa Jump - Game Giáng Sinh Tích Điểm

Game web Giáng sinh với hệ thống tích điểm, bảng xếp hạng, giới thiệu bạn bè và đổi quà tặng. Được xây dựng cho **Mắt Kính Tâm Đức** - Chương trình Giáng Sinh 2025.

## 📋 Tổng Quan

**Santa Jump** là một web game kiểu Flappy Bird với chủ đề Giáng sinh, nơi người chơi điều khiển ông già Noel nhảy qua các ống khói để ghi điểm. Game tích hợp đầy đủ hệ thống backend với các tính năng:

- 🎮 **Game Engine**: Canvas-based game với physics engine tùy chỉnh
- 🔐 **Authentication**: Đăng nhập qua Email (OTP) hoặc Phone (ZNS/SMS OTP)
- 🏆 **Leaderboard**: Bảng xếp hạng theo ngày/tuần/tháng với giải thưởng
- 🎁 **Reward System**: Đổi điểm lấy voucher (50K, 100K, 150K...)
- 👥 **Referral System**: Giới thiệu bạn bè nhận thêm lượt chơi
- 📧 **Email Notifications**: Thông báo tự động qua email
- 🛡️ **Anti-Cheat**: Hệ thống chống gian lận 7 lớp
- 👨‍💼 **Admin Dashboard**: Quản lý game, người chơi, chiến dịch

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Data Fetching**: SWR (client-side caching)

### Backend
- **Runtime**: Node.js (Next.js API Routes)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT-based với HTTP-only cookies
- **Email**: Resend (primary) + Gmail SMTP (fallback)
- **SMS/ZNS**: VIHAT MultiChannel API (Supabase Edge Functions)

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase Cloud
- **Edge Functions**: Supabase (Deno runtime)
- **Cron Jobs**: Vercel Cron

## 📁 Cấu Trúc Dự Án

```
santa-jump/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                # Authentication (send-otp, verify-otp, logout, me)
│   │   ├── game/                # Game logic (start, end, config)
│   │   ├── leaderboard/         # Leaderboard APIs
│   │   ├── user/                # User management (stats, add-phone-bonus)
│   │   ├── voucher/             # Voucher redemption
│   │   ├── referral/            # Referral system
│   │   ├── rewards/             # Rewards management
│   │   ├── notifications/       # Notification system
│   │   ├── admin/               # Admin APIs
│   │   ├── cron/                # Scheduled jobs
│   │   └── debug/               # Debug utilities
│   ├── game/                    # Game page
│   ├── leaderboard/             # Leaderboard pages (daily, weekly, monthly)
│   ├── admin/                   # Admin dashboard
│   │   ├── dashboard/          # Overview stats
│   │   ├── config/             # Game configuration
│   │   ├── campaigns/          # Campaign management
│   │   ├── suspicious/         # Anti-cheat monitoring
│   │   ├── email-logs/         # Email delivery logs
│   │   ├── email-templates/    # Email template editor
│   │   ├── notifications/      # Notification management
│   │   └── rewards/            # Reward configuration
│   ├── gift/                    # Gift redemption page
│   ├── referral/                # Referral page
│   ├── play-history/            # User play history
│   ├── rules/                   # Game rules
│   ├── policy/                  # Terms & conditions
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   └── page.tsx                 # Homepage
│
├── components/                   # React Components
│   ├── GameCanvas.tsx           # Main game canvas
│   ├── GameOverModal.tsx        # Game over screen
│   ├── LoginModal.tsx           # Login/OTP modal
│   ├── ProfileModal.tsx         # User profile modal
│   ├── AddPhoneModal.tsx        # Phone verification modal
│   ├── GiftSection.tsx          # Gift redemption UI
│   ├── TopMenu.tsx              # Top navigation
│   ├── BottomNavigation.tsx     # Bottom navigation
│   ├── NotificationBell.tsx     # Notification bell
│   ├── AudioControls.tsx        # Audio controls
│   ├── FloatingAudioToggle.tsx  # Floating audio button
│   ├── OutOfPlaysModal.tsx      # Out of plays modal
│   └── Snowflakes.tsx           # Snowflake animation
│
├── lib/                          # Utilities & Services
│   ├── game/                    # Game logic
│   │   ├── engine.ts           # SantaJumpGame class (game engine)
│   │   ├── constants.ts        # Game constants & config
│   │   └── validateScore.ts    # Server-side score validation
│   ├── auth.ts                  # JWT authentication utilities
│   ├── supabase.ts              # Supabase client (anon key)
│   ├── supabase-admin.ts        # Supabase admin client (service role)
│   ├── emailService.ts          # Email service with fallback
│   ├── emailTemplates.ts        # Email HTML templates
│   ├── email.ts                 # Email helper functions
│   ├── vihat.ts                 # VIHAT SMS/ZNS integration
│   ├── gameConfig.ts            # Game configuration loader
│   ├── notifications.ts         # Notification utilities
│   ├── ratelimit.ts             # Rate limiting
│   ├── crypto.ts                # Cryptographic utilities
│   ├── date.ts                  # Date utilities
│   ├── userAgent.ts             # User agent detection
│   ├── voucher.ts               # Voucher utilities
│   ├── modalContent.ts          # Modal content loader
│   └── audio.ts                 # Audio management
│
├── hooks/                        # Custom React Hooks
│   ├── useAudio.ts              # Audio hook
│   ├── useBGM.ts                # Background music hook
│   └── useSFX.ts                # Sound effects hook
│
├── types/                        # TypeScript Types
│   └── database.ts              # Supabase database types
│
├── supabase/                     # Supabase Resources
│   ├── migrations/              # SQL migration files
│   │   ├── 20250127_enhanced_game_sessions.sql
│   │   ├── 20250128_email_logs.sql
│   │   └── ...
│   └── functions/               # Supabase Edge Functions (Deno)
│       ├── send_otp_phone/     # Send phone OTP via VIHAT
│       └── verify_otp_phone/   # Verify phone OTP
│
├── public/                       # Static Assets
│   ├── audio/                   # Sound effects & music
│   ├── images/                  # Images
│   └── ...
│
├── scripts/                      # Utility Scripts
│   └── fix-total-score.ts       # Database maintenance scripts
│
├── docs/                         # Documentation
│   └── SECURITY_TEST.md         # Anti-cheat testing guide
│
├── .env.example                  # Environment variables template
├── middleware.ts                 # Next.js middleware (auth, cache control)
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── vercel.json                   # Vercel deployment config
└── package.json                  # Dependencies
```

## 🎮 Game Mechanics

### Core Gameplay
- **Objective**: Điều khiển ông già Noel nhảy qua các ống khói
- **Controls**: Click/Tap để nhảy
- **Scoring**: +1 điểm mỗi khi vượt qua ống khói
- **Difficulty**: Tăng dần theo thời gian (tốc độ tăng, khoảng cách giảm)

### Game Phases
1. **Start Screen**: Màn hình chờ
2. **Practice Mode**: Chế độ luyện tập (không tính điểm)
3. **Playing**: Đang chơi (tính điểm)
4. **Game Over**: Kết thúc game

### Game Configuration (Dynamic)
Game config được lưu trong database và có thể thay đổi qua Admin Dashboard:

```typescript
{
  maxPlaysPerDay: 3,           // Số lượt chơi mặc định/ngày
  bonusPlaysForPhone: 2,       // Lượt thưởng khi thêm SĐT
  bonusPlaysForReferral: 1,    // Lượt thưởng cho người giới thiệu
  bonusPlaysForReferred: 1,    // Lượt thưởng cho người được giới thiệu
  gameMechanics: {
    gravity: 0.5,
    jumpForce: -10,
    maxFallSpeed: 12,
    obstacleSpeed: 2,
    gapHeight: 220,
    // ... more settings
  }
}
```

## 🔐 Authentication System

### Email Authentication (Primary)
1. User nhập email
2. Server gửi OTP (6 số) qua email
3. User nhập OTP để xác thực
4. Server tạo JWT token, lưu vào HTTP-only cookie

### Phone Authentication (Bonus Feature)
1. User nhập số điện thoại
2. Server gọi Supabase Edge Function `send_otp_phone`
3. Edge Function gọi VIHAT API (ZNS → SMS fallback)
4. User nhập OTP để xác thực
5. Server cộng bonus plays

### JWT Token Structure
```typescript
{
  userId: string,
  phone: string | null,
  email: string | null,
  exp: number  // 7 days
}
```

## 🛡️ Anti-Cheat System

### 7-Layer Validation

#### 1. Duration Check
- **Min**: 3 giây
- **Max**: 5 phút (300 giây)
- **Action**: Score = 0 nếu < 3s, warning nếu > 300s

#### 2. Score-Time Ratio
- **Rule**: Mỗi điểm cần ít nhất 1.2 giây
- **Formula**: `score * 1.2 <= duration`
- **Buffer**: +30% cho lag/skill

#### 3. Per-Game Cap
- **Max Score/Game**: 300 điểm
- **Configurable**: Qua Admin Dashboard

#### 4. Daily Cap
- **Max Score/Day**: 500 điểm/user
- **Reset**: Mỗi ngày lúc 00:00

#### 5. Session Validation
- **Game Token**: JWT với sessionId, userId, startTime
- **Status**: pending → processing → completed/invalid
- **Race Condition**: Atomic UPDATE với WHERE status='pending'

#### 6. Rate Limiting
- **Start Game**: 10 requests/phút/user
- **End Game**: 5 requests/phút/user
- **Open Sessions**: Max 3 concurrent/user

#### 7. Negative Score Check
- **Rule**: Score < 0 → Score = 0

### Suspicious Session Tracking
Mọi game session đều được lưu với:
- `client_score`: Điểm từ client
- `validated_score`: Điểm sau validation
- `suspicion_reason`: Lý do nghi ngờ (nếu có)
- `config_snapshot`: Game config tại thời điểm chơi

Admin có thể xem và invalidate suspicious sessions qua `/admin/suspicious`

## 📧 Email System

### Email Service Architecture
```
Priority: Resend → Gmail SMTP
Logging: All emails logged to email_logs table
```

### Email Types
- `otp`: OTP verification
- `referral_bonus`: Referral reward notification
- `referral_completion`: Referral completion notification
- `voucher_claim`: Voucher redemption
- `test`: Test emails

### Email Templates
Dynamic templates stored in `email_templates` table:
- Subject & HTML body with variable placeholders
- Variables: `{{otp}}`, `{{name}}`, `{{voucherCode}}`, etc.
- Editable via Admin Dashboard

### Fallback Logic
1. Try Resend API
2. If rate limited or failed → Try Gmail SMTP
3. Log all attempts to `email_logs` table

## 📱 Phone OTP System (VIHAT)

### Architecture
```
Client → Next.js API → Supabase Edge Function → VIHAT API
```

### Why Edge Functions?
- VIHAT credentials không cần expose trên Vercel
- Credentials hardcoded trong Edge Functions
- Deno runtime hỗ trợ tốt cho HTTP requests

### Flow
1. **Send OTP**:
   - POST `/api/auth/send-otp` (type: 'phone')
   - → Edge Function `send_otp_phone`
   - → VIHAT MultiChannel API (ZNS → SMS)
   - → Insert to `otp_login_vihat` table

2. **Verify OTP**:
   - POST `/api/user/add-phone-bonus`
   - → Edge Function `verify_otp_phone`
   - → Check OTP in `otp_login_vihat` table
   - → Add bonus plays to user

### Rate Limiting
- **Per Phone**: 5 OTP/hour
- **Per IP**: 20 OTP/hour
- **Delay**: 60s between OTP requests
- **Daily Cost Cap**: 200,000 VND

### VIHAT Configuration
```typescript
{
  API_KEY: "...",
  SECRET_KEY: "...",
  BRANDNAME: "MKTAMDUC",
  ZNS_TEMPLATE_ID: "478665",
  OAID: "939629380721919913"
}
```

## 🏆 Leaderboard System

### Types
- **Daily**: Top players hôm nay
- **Weekly**: Top players tuần này
- **Monthly**: Top players tháng này

### Caching Strategy
- **Middleware**: Force no-cache headers
- **SWR**: Client-side revalidation every 30s
- **Database Views**: Optimized queries

### Prizes
- **Weekly Top 1**: 5 triệu VND
- **Monthly Top 1**: iPhone 17

## 🎁 Reward System

### Voucher Tiers
| Điểm | Voucher | Mô tả |
|------|---------|-------|
| 10   | 50K     | Voucher 50,000 VND |
| 20   | 100K    | Voucher 100,000 VND |
| 30   | 150K    | Voucher 150,000 VND |

### Redemption Flow
1. User click "Đổi quà"
2. Check `total_score >= required_score`
3. Deduct score from user
4. Generate unique voucher code
5. Send email with voucher
6. Insert to `vouchers` table

### Voucher Code Format
```
MKTD-XXXXXXXX
```

## 👥 Referral System

### How It Works
1. User A shares referral link: `/?ref=ABC123`
2. User B clicks link, registers
3. System creates referral record
4. Both users receive bonus plays

### Bonus Structure
- **Referrer**: +1 lượt chơi
- **Referred**: +1 lượt chơi
- **Configurable**: Qua Admin Dashboard

### Referral Code
- **Format**: 6 ký tự uppercase (A-Z, 0-9)
- **Unique**: Per user
- **Auto-generated**: Khi user đăng ký

## 👨‍💼 Admin Dashboard

### Features
- **Dashboard**: Tổng quan stats (users, plays, vouchers)
- **Game Config**: Chỉnh sửa game settings
- **Campaigns**: Quản lý chiến dịch
- **Suspicious Sessions**: Monitor & invalidate cheaters
- **Email Logs**: Xem email delivery logs
- **Email Templates**: Chỉnh sửa email templates
- **Notifications**: Quản lý thông báo
- **Rewards**: Cấu hình rewards

### Access
- URL: `/admin`
- Login: Username/Password (bcrypt hashed)
- Session: JWT token in HTTP-only cookie

## 🔧 Setup & Development

### 1. Prerequisites
- Node.js 18+
- npm hoặc yarn
- Supabase account
- Vercel account (optional, for deployment)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` và điền thông tin:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
JWT_SECRET=your-secret-key-change-this-in-production

# Mock OTP (set false để dùng OTP thật)
MOCK_OTP_ENABLED=true

# VIHAT SMS API (optional, for phone OTP)
VIHAT_API_KEY=your-api-key
VIHAT_SECRET_KEY=your-secret-key
VIHAT_BRANDNAME=MKTAMDUC
```

### 4. Database Setup
Run migrations trong Supabase Dashboard:
```sql
-- Run all files in supabase/migrations/ in order
```

### 5. Deploy Edge Functions
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Deploy functions
supabase functions deploy send_otp_phone
supabase functions deploy verify_otp_phone
```

### 6. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Build for Production
```bash
npm run build
npm start
```

## 🚀 Deployment

### Vercel Deployment
1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy

### Cron Jobs
Configured in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/notifications",
    "schedule": "0 1 * * *"  // Daily at 1 AM
  }]
}
```

## 📝 Best Practices

### TypeScript
- ✅ Strict mode enabled
- ✅ All code must pass type checking
- ✅ Use proper types from `types/database.ts`

### API Routes
- ✅ Always return `NextResponse.json()` with status codes
- ✅ Use `supabaseAdmin` for writes (not `supabase`)
- ✅ Handle errors properly with try-catch

### Email Sending
- ✅ **ALWAYS** use `lib/emailService.ts`
- ❌ **NEVER** use `resend` or `nodemailer` directly
- ✅ This ensures logging and fallback logic

### Supabase Queries
- ✅ Select only needed fields
- ✅ Use `.single()` for single row queries
- ✅ Check for errors after every query

### Build Before Push
```bash
npm run build  # Catch TypeScript errors early
```

## 🐛 Common Issues

### 1. TypeScript: Property does not exist
```typescript
// ❌ Wrong
const { data } = await supabase.from('users').select('id, name').single()
console.log(data.email)  // Error!

// ✅ Correct
const { data } = await supabase.from('users').select('id, name, email').single()
console.log(data.email)  // Works!
```

### 2. Supabase writes failing silently
**Problem**: Using `supabase` (anon key) for writes in API routes

**Solution**: Always use `supabaseAdmin` (service role) for INSERT/UPDATE/DELETE

### 3. Email not sending
**Check**:
1. Environment variables set correctly?
2. Resend API key valid?
3. Gmail SMTP credentials correct?
4. Check `email_logs` table for errors

## 📊 Database Schema

### Main Tables
- `users`: User accounts
- `game_sessions`: Game play sessions
- `vouchers`: Redeemed vouchers
- `referrals`: Referral relationships
- `otp_codes`: Email OTP codes
- `otp_login_vihat`: Phone OTP codes
- `email_logs`: Email delivery logs
- `email_templates`: Email templates
- `notifications`: User notifications
- `game_config`: Game configuration
- `campaigns`: Marketing campaigns
- `admins`: Admin accounts

See `types/database.ts` for full schema.

## 🎵 Audio System

### Audio Files
- **BGM**: Background music (homepage, game)
- **SFX**: Sound effects (jump, score, game over)

### Hooks
- `useAudio()`: Base audio hook
- `useBGM()`: Background music management
- `useSFX()`: Sound effects management

### Controls
- Floating audio toggle button
- Persistent state (localStorage)
- Auto-play on user interaction

## 📄 License

© 2025 Mắt Kính Tâm Đức. All rights reserved.

---

**Developed with ❤️ for Christmas 2025 Campaign**
