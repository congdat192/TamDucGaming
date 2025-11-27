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
3. **Validation:** Server validates based on duration, config, and caps
4. **Storage:** Both `client_score` (raw) and `validated_score` (verified) saved

### Limits
- **Max Duration:** 5 minutes per game
- **Per-Game Cap:** 200 points max
- **Daily Cap:** 500 points per user per day

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
