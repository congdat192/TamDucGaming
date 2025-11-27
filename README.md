# Santa Jump

Game Giáng sinh tích hợp hệ thống điểm, leaderboard, referral và rewards.

## Overview

Santa Jump là web game sử dụng Next.js 14, cho phép người chơi:
- Chơi game thu thập điểm
- Xem bảng xếp hạng
- Giới thiệu bạn bè qua referral code
- Đổi điểm lấy quà
- Nhận thông báo qua email

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **UI:** React 18, Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Data Fetching:** SWR (client-side)
- **Authentication:** JWT-based with OTP verification
- **Email:** Resend (primary), Nodemailer/Gmail SMTP (fallback)
- **SMS/ZNS OTP:** VIHAT MultiChannel (ZNS → SMS fallback)
- **Deployment:** Vercel

## Project Structure

```
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication (send-otp, verify-otp, logout)
│   │   ├── game/            # Game endpoints (start, end)
│   │   ├── admin/           # Admin APIs (config, campaigns, suspicious-sessions)
│   │   ├── leaderboard/     # Leaderboard API
│   │   ├── voucher/         # Voucher redemption
│   │   └── ...              # Other APIs
│   ├── game/                # Game page
│   ├── leaderboard/         # Leaderboard pages
│   ├── admin/               # Admin dashboard
│   │   ├── dashboard/       # Overview stats
│   │   ├── config/          # Game configuration
│   │   ├── campaigns/       # Campaign management
│   │   ├── suspicious/      # Anti-cheat monitoring
│   │   └── ...              # Other admin pages
│   ├── referral/            # Referral page
│   └── ...                  # Other pages
├── components/              # React components
│   ├── GameCanvas.tsx      # Main game canvas
│   ├── GameOverModal.tsx   # Game over screen
│   ├── LoginModal.tsx      # Login/OTP modal
│   └── ...                 # Other components
├── lib/                     # Services & utilities
│   ├── auth.ts             # JWT + OTP authentication
│   ├── supabase.ts         # Supabase client (anon key)
│   ├── supabase-admin.ts   # Supabase admin (service role)
│   ├── emailService.ts     # Email with fallback logic
│   ├── gameConfig.ts       # Game configuration
│   ├── ratelimit.ts        # Rate limiting
│   ├── vihat.ts            # VIHAT SMS/ZNS OTP service
│   └── game/               # Game logic
│       ├── engine.ts       # Game engine (SantaJumpGame)
│       └── validateScore.ts # Server-side score validation
├── types/                   # TypeScript definitions
│   └── database.ts         # Supabase schema types
├── hooks/                   # Custom React hooks
│   ├── useAudio.ts         # Audio management
│   ├── useBGM.ts           # Background music
│   └── useSFX.ts           # Sound effects
├── public/                  # Static assets (audio, images)
├── supabase/                # Database migrations
│   └── migrations/         # SQL migration files
├── docs/                    # Documentation
│   └── SECURITY_TEST.md    # Anti-cheat testing guide
├── scripts/                 # Utility scripts
└── .claude/                 # Claude AI configuration
    └── claude.md           # Project guide for Claude
```

## Setup & Development

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env` and fill in:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
# Mock OTP (set false for real OTP)
MOCK_OTP_ENABLED=true

# VIHAT SMS/ZNS (eSMS.vn)
VIHAT_API_KEY=your-api-key
VIHAT_SECRET_KEY=your-secret-key
VIHAT_BRANDNAME=YOUR_BRAND
VIHAT_ZNS_TEMPLATE_ID=your-template-id
VIHAT_ZALO_OAID=your-zalo-oaid
```

### 3. Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 4. Build for production
```bash
npm run build
npm start
```

## Deployment

**Platform:** Vercel

**Cron Jobs:**
- `/api/cron/notifications` runs daily at 1 AM (configured in `vercel.json`)

**Steps:**
1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

## Anti-Cheat System

Server-side score validation to prevent cheating:

### Flow
1. **Game Start:** Server creates session with unique `game_token`
2. **Game End:** Client sends `{ gameToken, score }`
3. **Validation:** Server validates using 7-layer checks
4. **Storage:** Both `client_score` (raw) and `validated_score` (verified) saved

### Limits
- **Max Duration:** 5 minutes per game
- **Per-Game Cap:** 300 points max
- **Daily Cap:** 500 points per user per day
- **Min time per point:** 1.2 seconds
- **Buffer:** 30% for lag/skill

### Security Features
- **Rate limit** `/api/game/start`: 10 req/min per user
- **Rate limit** `/api/game/end`: 5 req/min per user
- **Open sessions limit:** Max 3 concurrent sessions per user
- **Race condition protection:** Atomic UPDATE with status='processing'

### Validation Logic (7 layers)
1. Duration too short (< 3s) → score = 0
2. Duration too long (> 300s) → warning
3. Score > 0 but < 3s → score = 0
4. Sanity check: each point needs ≥ 1.2s
5. Config-based max using GAME_CONFIG + gameMechanics
6. Daily cap: 500 pts/day
7. Negative score → score = 0

### Admin Monitoring
- URL: `/admin/suspicious`
- View flagged sessions, invalidate cheaters, track stats

### Migration
Run `supabase/migrations/20250127_enhanced_game_sessions.sql` on Supabase to add:
- `game_token`, `status`, `validated_score`, `suspicion_reason`, `config_snapshot`

## Notes / Best Practices

1. **TypeScript Strict Mode:** All code must pass strict type checking
2. **Import Alias:** Use `@/` for imports (e.g., `@/lib/supabase`)
3. **API Routes:** Always return `NextResponse.json()` with proper status codes
4. **Client Components:** Use `'use client'` directive for interactive components
5. **Authentication:** JWT tokens stored in HTTP-only cookies, OTP-based verification
6. **Email Service:**
   - **ALWAYS** use `lib/email.ts` or `lib/emailService.ts` for sending emails.
   - **NEVER** use `resend` or `nodemailer` directly in API routes.
   - This ensures all emails are logged to `email_logs` table and fallback logic works.

## Common Errors & Solutions

### TypeScript: Property does not exist on Supabase select
```typescript
// ❌ Wrong - accessing field not in select
const { data } = await supabase.from('table').select('a, b').single()
console.log(data.c)  // Error: 'c' doesn't exist!

// ✅ Correct - include all needed fields
const { data } = await supabase.from('table').select('a, b, c').single()
console.log(data.c)  // Works!
```

### Supabase writes failing silently
- **Problem:** Using `supabase` (anon key) for writes in API routes
- **Solution:** Always use `supabaseAdmin` (service role) for INSERT/UPDATE/DELETE

### Build before push
Always run `npm run build` locally before pushing to catch TypeScript errors early.

## Phone OTP System (VIHAT ZNS/SMS)

### Overview
Phone verification uses VIHAT (eSMS.vn) MultiChannel API with automatic fallback:
- **Primary:** ZNS (Zalo Notification Service) - cheaper, higher delivery rate
- **Fallback:** SMS - when ZNS fails (user not on Zalo, etc.)

### Architecture
```
User → /api/auth/send-otp → lib/vihat.ts → VIHAT MultiChannel API
                                            ├── Try ZNS first
                                            └── Auto fallback SMS
```

### Database Tables
- **`otp_codes`** - For EMAIL OTP only
- **`otp_login_vihat`** - For PHONE OTP via VIHAT

### Table: otp_login_vihat
```sql
id UUID PRIMARY KEY
phone VARCHAR(20) NOT NULL
otp_code VARCHAR(10) NOT NULL
minute INTEGER DEFAULT 5
created_at TIMESTAMPTZ
expires_at TIMESTAMPTZ
verified BOOLEAN DEFAULT FALSE
attempts INTEGER DEFAULT 0
ip_address VARCHAR(45)
cost NUMERIC(10,2) DEFAULT 500
brandname VARCHAR(50)
campaign_id VARCHAR(100)
channel_sent VARCHAR(20)  -- 'zns', 'sms', 'multi', 'mock', 'failed', 'pending'
sms_request_id VARCHAR(100)
zns_request_id VARCHAR(100)
notes TEXT
```

### Rate Limiting (Cost Protection)
| Limit | Value | Purpose |
|-------|-------|---------|
| Delay between OTP | 60 seconds | Prevent spam same phone |
| Per phone/hour | 5 OTP max | Limit per user |
| Per IP/hour | 20 OTP max | Block bot spam |
| Daily cost cap | 200,000 VND | Business cost protection |

### VIHAT MultiChannel API
```typescript
// Endpoint
POST https://rest.esms.vn/MainService.svc/json/MultiChannelMessage/

// Payload
{
  ApiKey: "xxx",
  SecretKey: "xxx",
  Phone: "84xxxxxxxxx",
  Channels: ['zalo', 'sms'],  // Priority order
  Data: [
    // ZNS config
    { TempID: "478665", Params: [otp, "5"], OAID: "xxx" },
    // SMS config (fallback)
    { Content: "Ma xac thuc: xxx", Brandname: "MKTAMDUC" }
  ]
}
```

### Key Files
- `lib/vihat.ts` - VIHAT API integration
- `app/api/auth/send-otp/route.ts` - OTP sending endpoint
- `app/api/auth/verify-otp/route.ts` - OTP verification endpoint
- `app/api/user/add-phone-bonus/route.ts` - Phone bonus with OTP verify
