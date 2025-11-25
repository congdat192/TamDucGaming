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
├── app/                  # Next.js App Router
│   ├── api/             # API routes
│   ├── game/            # Game page
│   ├── leaderboard/     # Leaderboard pages
│   ├── admin/           # Admin dashboard (8 sub-pages)
│   ├── referral/        # Referral page
│   └── ...              # Other pages
├── components/          # React components
├── lib/                 # Services & utilities
│   ├── auth.ts         # JWT + OTP authentication
│   ├── supabase.ts     # Supabase client (anon key)
│   ├── supabase-admin.ts # Supabase admin (service role)
│   ├── emailService.ts # Email with fallback logic
│   └── game/           # Game logic
├── types/              # TypeScript definitions
│   └── database.ts     # Supabase schema types
├── hooks/              # Custom React hooks
├── public/             # Static assets (audio, images)
├── supabase/           # Database migrations
└── scripts/            # Utility scripts
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
NEXT_PUBLIC_BASE_URL=http://localhost:3000
JWT_SECRET=your-secret-key-change-in-production

# Email (Resend - primary)
RESEND_API_KEY=your-resend-api-key

# Email (Gmail - fallback, optional)
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-app-password

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

## Notes / Best Practices

1. **TypeScript Strict Mode:** All code must pass strict type checking
2. **Import Alias:** Use `@/` for imports (e.g., `@/lib/supabase`)
3. **API Routes:** Always return `NextResponse.json()` with proper status codes
4. **Client Components:** Use `'use client'` directive for interactive components
5. **Authentication:** JWT tokens stored in HTTP-only cookies, OTP-based verification
6. **Email Service:** Auto-fallback from Resend to Gmail SMTP if rate limited
