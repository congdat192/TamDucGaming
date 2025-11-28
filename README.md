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
├── supabase/                # Supabase resources
│   ├── migrations/         # SQL migration files
│   └── functions/          # Supabase Edge Functions
│       ├── send_otp_phone/     # Send phone OTP via VIHAT
│       └── verify_otp_phone/   # Verify phone OTP
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

## Phone OTP System (VIHAT ZNS/SMS via Supabase Edge Functions)

### Overview
Phone verification uses **Supabase Edge Functions** to call VIHAT (eSMS.vn) MultiChannel API.
This architecture avoids needing VIHAT credentials on Vercel - credentials are hardcoded in Edge Functions.

- **Primary:** ZNS (Zalo Notification Service) - cheaper, higher delivery rate
- **Fallback:** SMS - when ZNS fails (user not on Zalo, etc.)

### Architecture (Updated 2025-11-29)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CLIENT (Browser)                                                           │
│    ├── AddPhoneModal.tsx     → User enters phone (2-step OTP flow)         │
│    └── ProfileModal.tsx      → User enters phone in profile (OTP flow)     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  NEXT.JS API ROUTES (Vercel)                                                │
│    ├── /api/auth/send-otp           → Calls Edge Function send_otp_phone   │
│    └── /api/user/add-phone-bonus    → Calls Edge Function verify_otp_phone │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  SUPABASE EDGE FUNCTIONS (Deno)                                             │
│    ├── send_otp_phone      → Validate, Rate limit, Call VIHAT API          │
│    └── verify_otp_phone    → Verify OTP from otp_login_vihat table         │
│                                                                             │
│    VIHAT credentials HARDCODED here (not in Vercel env)                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  VIHAT MultiChannel API (eSMS.vn)                                           │
│    POST https://rest.esms.vn/MainService.svc/json/MultiChannelMessage/     │
│    ├── Try ZNS (Zalo) first                                                 │
│    └── Auto fallback to SMS                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Project Structure (Edge Functions)
```
supabase/
├── functions/
│   ├── send_otp_phone/
│   │   └── index.ts         # Send OTP via VIHAT (ZNS → SMS)
│   └── verify_otp_phone/
│       └── index.ts         # Verify OTP from otp_login_vihat table
```

### Supabase Edge Functions

#### send_otp_phone
- Validate Vietnamese phone format
- Rate limiting (5 OTP/phone/hour, 20 OTP/IP/hour)
- Daily cost cap (200,000 VND)
- Insert record to `otp_login_vihat` table
- Call VIHAT MultiChannel API
- **VIHAT credentials hardcoded** (no env needed on Vercel)

#### verify_otp_phone
- Find OTP record by phone
- Check max attempts (5 tries)
- Verify OTP code
- Mark as verified

### Deploying Edge Functions
```bash
# Option 1: Supabase CLI
npm install -g supabase
supabase login
supabase functions deploy send_otp_phone
supabase functions deploy verify_otp_phone

# Option 2: Supabase Dashboard
# 1. Go to Supabase Dashboard → Edge Functions
# 2. Create new function
# 3. Copy code from supabase/functions/{name}/index.ts
# 4. Deploy
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
verified_at TIMESTAMPTZ
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

### OTP Entry Points (All use same Edge Functions)
| Component | Trigger | Modal/Flow |
|-----------|---------|------------|
| GameOverModal | Out of plays, no phone | → AddPhoneModal (2-step OTP) |
| game/page.tsx | Out of plays, no phone | → AddPhoneModal (2-step OTP) |
| ProfileModal | No phone in profile | → Integrated OTP flow |

### VIHAT Credentials (in Edge Functions)
```typescript
// supabase/functions/send_otp_phone/index.ts
const VIHAT_CONFIG = {
  API_KEY: "B70DE56E1A997DF6BB197CEEC85B7A",
  SECRET_KEY: "FCD201C2BEE44E7FB641261801AB94",
  BRANDNAME: "MKTAMDUC",
  ZNS_TEMPLATE_ID: "478665",
  OAID: "939629380721919913",
  API_URL: "https://rest.esms.vn/MainService.svc/json/MultiChannelMessage/"
};
```

### Key Files
| File | Description |
|------|-------------|
| `supabase/functions/send_otp_phone/index.ts` | Edge Function: Send OTP via VIHAT |
| `supabase/functions/verify_otp_phone/index.ts` | Edge Function: Verify OTP |
| `app/api/auth/send-otp/route.ts` | Next.js API: Calls send_otp_phone |
| `app/api/user/add-phone-bonus/route.ts` | Next.js API: Calls verify_otp_phone |
| `components/AddPhoneModal.tsx` | Frontend: 2-step OTP flow modal |
| `components/ProfileModal.tsx` | Frontend: OTP flow in profile |

### Flow Diagram
```
1. User enters phone → POST /api/auth/send-otp
2. Next.js API → POST {SUPABASE_URL}/functions/v1/send_otp_phone
3. Edge Function:
   a. Validate phone format
   b. Check rate limits
   c. Generate OTP
   d. Insert to otp_login_vihat
   e. Call VIHAT API (ZNS → SMS fallback)
4. User receives OTP via Zalo/SMS
5. User enters OTP → POST /api/user/add-phone-bonus
6. Next.js API → POST {SUPABASE_URL}/functions/v1/verify_otp_phone
7. Edge Function:
   a. Find OTP record
   b. Check attempts (max 5)
   c. Verify OTP
   d. Mark verified=true
8. Next.js API → Add bonus plays to user
```
