# Claude Project Guide

## 1. Tech Stack Summary

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript with strict mode
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Data Fetching:** SWR for client-side
- **Auth:** JWT tokens with OTP verification (custom implementation)
- **Email:** Resend (primary), Nodemailer/Gmail SMTP (fallback)
- **Deployment:** Vercel with cron jobs

## 2. Project Architecture

### File Organization
- **Pages & Routes:** `/app` directory (Next.js App Router)
- **API Endpoints:** `/app/api/*` with route.ts files
- **Components:** `/components` for reusable React components
- **Business Logic:** `/lib` for services, utilities, helpers
- **Type Definitions:** `/types/database.ts` for Supabase schema types

### Naming Conventions (observed in codebase)
- API routes: `route.ts` inside `/app/api/{endpoint}/`
- Components: PascalCase (e.g., `TopMenu.tsx`, `GameCanvas.tsx`)
- Services: camelCase (e.g., `supabase.ts`, `auth.ts`, `emailService.ts`)
- Types: PascalCase interfaces (e.g., `Database`, `TopMenuProps`)

### Module Patterns
- **Supabase Client:**
  - `lib/supabase.ts` - uses anon key (client-safe)
  - `lib/supabase-admin.ts` - uses service role key (server-only)
- **Auth Flow:**
  - User enters phone/email → Send OTP → Verify OTP → Generate JWT → Store in cookies
  - JWT tokens stored in cookies (`auth-token`)
  - Verified via `lib/auth.ts` `verifyToken()`
  - **NOT using Supabase Auth** - custom JWT implementation
- **Email Service:**
  - Priority: Resend → Fallback: Gmail SMTP (Nodemailer)
  - Auto-fallback on rate limits or errors
  - All emails logged to `email_logs` table
- **API Response Pattern:**
  ```ts
  return NextResponse.json({ data }, { status: 200 })
  return NextResponse.json({ error: 'message' }, { status: 4xx })
  ```

## 3. Coding Conventions

### TypeScript
- **Strict mode enabled** - all code must pass strict checks
- **Use `interface` for types** (observed in `types/database.ts`, component props)
- **Import alias:** Always use `@/` for project imports
  ```ts
  import { supabase } from '@/lib/supabase'
  ```

### Component Structure
- Client components: Start with `'use client'` directive
- Props: Define typed interface (e.g., `interface TopMenuProps`)
- Exports: Default export for components

### API Routes
- File location: `/app/api/{endpoint}/route.ts`
- Export HTTP methods: `export async function GET/POST/PUT/DELETE`
- Always return `NextResponse.json()`
- Error handling: try-catch with 500 status on errors
- Auth check pattern:
  ```ts
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  ```

### Services in `/lib`
- Export functions (not classes)
- Supabase queries directly in services
- Utilities are pure functions

### Language
- Error messages, UI text: **Vietnamese**
- Code comments, variable names: **English**

## 4. Forbidden Mistakes

### ❌ NEVER Do These:

1. **File/Folder Creation:**
   - Do NOT create new folders outside existing structure
   - Do NOT create files unless explicitly requested
   - Do NOT create helper/utility files "for organization"

2. **Dependencies:**
   - Do NOT add libraries not in `package.json`
   - Do NOT suggest using Prisma (project uses Supabase client directly)
   - Do NOT use React Query (project uses SWR)
   - Do NOT suggest Supabase Auth (project uses custom JWT)

3. **Architecture Changes:**
   - Do NOT refactor folder structure
   - Do NOT convert to Supabase Auth (custom JWT is intentional)
   - Do NOT change auth pattern (JWT in cookies with OTP)
   - Do NOT introduce new state management (no Redux, Zustand, etc.)

4. **Code Patterns:**
   - Do NOT use inline styles (use Tailwind classes only)
   - Do NOT bypass TypeScript strict checks with `any`
   - Do NOT use relative imports (use `@/` alias)
   - Do NOT create wrapper components unnecessarily

5. **Supabase:**
   - Do NOT use `lib/supabase-admin.ts` in client components
   - Do NOT expose service role key to client
   - Do NOT bypass RLS unless in admin API routes with service role key

6. **Authentication:**
   - Do NOT use `supabase.auth.signIn/signUp` (not used in this project)
   - Do NOT change JWT token storage (must stay in HTTP-only cookies)
   - Do NOT modify OTP generation logic without approval

## 5. Security / Data Rules

### Supabase Client Usage
- **Client-side:** Only use `lib/supabase.ts` (anon key)
- **Server-side API:** Can use `lib/supabase-admin.ts` (service role key)
- **RLS:** Respect Row Level Security policies

### Authentication
- JWT tokens stored in HTTP-only cookies (`auth-token` for users, `admin-token` for admins)
- Verify tokens using `lib/auth.ts` `verifyToken()`
- Never send tokens in response body
- OTP codes expire after set time
- Mock OTP mode available for development

### Email Service
- Never expose API keys to client
- Always use `lib/emailService.ts` for sending emails
- Service handles fallback automatically
- All emails logged to `email_logs` table

### Sensitive Data
- User phone numbers: Mask with `maskPhone()` before logging
- User emails: Mask with `maskEmail()` before logging
- OTP codes: Never log actual codes in production
- Service role key: Server-side only, never expose

### API Security
- Always validate user input
- Check authentication before data access
- Return 401 for unauthenticated requests
- Return 403 for unauthorized access
- Return 404 for not found (don't leak existence info)

## 6. Bug-Prevention Section

### Bug Prevent Log

#### [2025-11-25] [BUG] User bonus plays not saved when adding phone
**Description:** User adds phone and modal shows "+4 lượt chơi", but database `bonus_plays` remains 0. Play logs correctly record +4, but user update doesn't persist.

**Root cause:**
- API used `supabase` client (anon key) instead of `supabaseAdmin` (service role key)
- RPC function `add_bonus_plays` executed and logged to `play_logs` table
- BUT the `UPDATE users SET bonus_plays = ...` failed silently due to insufficient permissions
- Anon key client has RLS restrictions that prevent direct updates even through RPC

**Prevention:**
1. **ALWAYS use `supabaseAdmin` in API routes for database writes**
2. Check all API routes in `/app/api/*` that modify user data
3. `supabase` (anon key) should ONLY be used for:
   - Client-side reads respecting RLS
   - Server-side reads when RLS is acceptable
4. `supabaseAdmin` (service role key) should be used for:
   - ALL server-side writes (INSERT, UPDATE, DELETE)
   - RPC function calls that modify data
   - Operations that need to bypass RLS

**Solution implemented:**
- Changed `supabase.rpc()` → `supabaseAdmin.rpc()` in add-phone-bonus route
- Changed `supabase.from('users').update()` → `supabaseAdmin.from('users').update()`
- Verified all database modifications use admin client

**Rule:**
- ❌ Never use `supabase` (anon key) for database writes in API routes
- ❌ Never assume RPC functions work correctly with anon key
- ✅ Always use `supabaseAdmin` for INSERT/UPDATE/DELETE in server-side code
- ✅ Always use `supabaseAdmin` for RPC calls that modify data
- ✅ Double-check: If API route modifies database → must use `supabaseAdmin`

---

#### [2025-11-25] [BUG] Leaderboard showing stale data on production
**Description:** Production UI showed 81 points while API returned 300 points. Localhost worked correctly.

**Root cause:**
- Vercel CDN cached old JavaScript bundles
- Client Component ('use client') with client-side fetch still has HTML/JS cached
- Setting `cache: 'no-store'` in fetch() only prevents API cache, NOT HTML/JS cache

**Prevention:**
1. Always purge Vercel cache after important deployments
   - Vercel Dashboard → Settings → Data Cache → Purge Everything
2. Test in Incognito mode to verify no cache issues
3. Check both API response AND UI display match

**Solution implemented:**
- Added `export const dynamic = 'force-dynamic'` to pages
- Added cache headers in next.config.js, middleware.ts, and vercel.json
- Must manually purge cache after deploy for immediate effect

**Rule:**
- ❌ Never assume client-side fetch with no-cache means no caching at all
- ✅ Always purge Vercel cache after deploy if data display is critical
- ✅ Use Server Components for data that must be fresh on every request

**Format for adding entries:**
```
- [DATE] [BUG] Description of bug
  - Root cause: Why it happened
  - Prevention: How to avoid in future
  - Rule: Never do X, always do Y
```

---

#### [2025-01-26] [BUG] Game sessions saved but total_score not updated

**Description:** User play history showed 106 points (from game_sessions), but profile and leaderboard showed only 18 points (from users.total_score). Affected 6 out of 41 users with inconsistent data.

**Root cause:**
- In `/api/game/end`, if `users.total_score` update fails, the error is only logged but execution continues
- The API returns success even though total_score wasn't updated
- Game session is saved to `game_sessions` table, but `users.total_score` remains stale
- This creates data inconsistency: sum(game_sessions.score) ≠ users.total_score

**Code issue (line 143-145):**
```typescript
if (updateError) {
  console.error('[GAME END] Failed to update user score:', updateError)
  // ❌ No return - continues execution and returns success!
}
```

**Prevention:**
1. **ALWAYS return error** when critical database operations fail
2. Never silently log errors for operations that affect core business logic (scores, payments, etc.)
3. Implement data consistency checks via scheduled jobs or triggers
4. Created `scripts/fix-total-score.ts` to recalculate and fix inconsistencies

**Solution implemented:**
- Changed error handling to return 500 error immediately if total_score update fails
- Created fix script that recalculates total_score from game_sessions for all users
- Added npm script `npm run fix-score [email]` to fix specific user or all users
- Fixed 6 users with data inconsistencies (total difference: +484 points)

**Rule:**
- ❌ Never silently log errors for critical operations (scores, money, inventory, etc.)
- ❌ Never continue execution after critical database write fails
- ✅ Always return error response immediately when critical operations fail
- ✅ Always validate that critical updates succeeded before returning success
- ✅ Create data consistency check scripts for important aggregated fields

**Data fixed:**
```
tiendatabv@gmail.com:        18 → 106 (+88)
dnbtram@matkinhtamduc.com:    2 → 12  (+10)
ptranhongan@gmail.com:        1 → 71  (+70)
namnguyen1506@gmail.com:      3 → 209 (+206)
congdat192@gmail.com:        42 → 62  (+20)
tranquynh2105@gmail.com:     65 → 145 (+80)
phukienmatkinh668@gmail.com: 21 → 51  (+30)
```

---

#### [2025-11-25] [BUG] Voucher emails sent but not logged
**Description:** User received voucher emails but no logs appeared in `email_logs` table.

**Root cause:**
- API routes (`voucher/redeem`, `rewards/redeem`) imported `Resend` SDK directly.
- Bypassed `lib/emailService.ts` which handles logging.

**Prevention:**
1. **ALWAYS use centralized email service**
2. Never import `resend` or `nodemailer` in API routes (except for testing).

**Rule:**
- ❌ Never use `resend` or `nodemailer` directly in API routes
- ✅ Always use `sendVoucherEmail`, `sendOtpEmail`, etc. from `lib/email.ts`
- ✅ Always use `lib/emailService.ts` if creating new email types

---

## 7. Instructions For Claude

### Before Every Task:
1. **READ THIS FILE FIRST**
2. Check if task violates any rules in Section 4
3. Ask user if uncertain about architecture changes

### When Coding:
1. **Never create files** unless explicitly requested
2. **Always use existing patterns** from codebase
3. **Read existing files** before suggesting changes
4. **Follow TypeScript strict mode** - no `any`, no `@ts-ignore`
5. **Use proper imports** with `@/` alias
6. **Respect the architecture** - don't refactor structure

### When User Requests Changes:
1. If request violates conventions, **warn user first**
2. If adding new dependency, **ask for approval**
3. If changing architecture, **explain impact and ask**
4. If creating new files, **confirm necessity**

### Authentication Handling:
1. Always use custom JWT auth (`lib/auth.ts`)
2. Never suggest Supabase Auth as alternative
3. OTP verification is the only login method (for both Users and Admins)
4. JWT tokens must be in HTTP-only cookies

### Email Handling:
1. **ALWAYS** use `lib/email.ts` or `lib/emailService.ts`
2. **NEVER** use `resend` or `nodemailer` directly in API routes
3. Don't worry about fallback logic (handled automatically)
4. Pass `emailType` for proper logging
5. Include `userId` when available for tracking

### Error Handling:
1. Never silence errors with empty catch blocks
2. Always log errors with context
3. Return appropriate HTTP status codes
4. Use Vietnamese for user-facing error messages

### Testing Changes:
1. Suggest `npm run dev` to test locally
2. Check TypeScript compilation with `npm run build`
3. Verify no broken imports
4. Test auth flow if modifying auth-related code

---

---

#### [2025-01-27] [BUG] TypeScript error - Property does not exist on type in Supabase select

**Description:** Vercel build failed with error: `Property 'suspicion_reason' does not exist on type '{ user_id: any; validated_score: any; status: any; }'`

**Root cause:**
- Supabase `.select()` query only included some fields: `select('user_id, validated_score, status')`
- Later code tried to access `session.suspicion_reason` which wasn't in the select
- TypeScript correctly flagged this as an error since the field wasn't in the query result type

**Code issue:**
```typescript
// ❌ Wrong - suspicion_reason not in select
const { data: session } = await supabaseAdmin
  .from('game_sessions')
  .select('user_id, validated_score, status')  // Missing suspicion_reason!
  .single()

// Later tries to use it
suspicion_reason: (session.suspicion_reason || '') + ' | Admin invalidated'  // TS Error!
```

**Prevention:**
1. **ALWAYS include all fields** you need to access later in the `.select()` query
2. If accessing a field from query result, verify it's in the select string
3. Use TypeScript to catch these errors early with `npm run build` before pushing

**Solution implemented:**
```typescript
// ✅ Correct - include suspicion_reason in select
const { data: session } = await supabaseAdmin
  .from('game_sessions')
  .select('user_id, validated_score, status, suspicion_reason')  // Added!
  .single()

// Type-safe access with explicit cast
const currentReason = (session.suspicion_reason as string) || ''
```

**Rule:**
- ❌ Never access fields from Supabase query result that aren't in the `.select()` string
- ❌ Never assume a field exists just because it's in the table schema
- ✅ Always list ALL needed fields explicitly in `.select()`
- ✅ Always run `npm run build` locally before pushing to catch TypeScript errors
- ✅ Use explicit type casting when Supabase types are uncertain: `as string`, `as number`

---

## 8. Anti-Cheat System (Added 2025-01-27)

### Overview
Server-side score validation system to prevent cheating in game.

### Key Components
- **`lib/game/validateScore.ts`** - Score validation logic
- **`app/api/game/start/route.ts`** - Creates server-owned game session
- **`app/api/game/end/route.ts`** - Validates and stores scores
- **`app/admin/suspicious/page.tsx`** - Admin monitoring panel

### Flow
1. **Game Start:** Server creates `game_session` with unique `game_token`
2. **During Game:** Client only holds `gameToken`
3. **Game End:** Client sends `{ gameToken, score }`
4. **Validation:** Server calculates `validated_score` based on:
   - Duration (from server timestamps, not client)
   - Config snapshot (game settings at start time)
   - Daily cap (500 pts/day)
   - Per-game cap (200 pts/game)
5. **Storage:** Both `client_score` and `validated_score` saved
6. **Leaderboard/Vouchers:** Use `validated_score` only

### Constants (in `lib/game/validateScore.ts`)
```typescript
MAX_GAME_DURATION = 300           // 5 minutes max
MIN_GAME_DURATION = 3             // 3 seconds min
BUFFER_MULTIPLIER = 1.3           // +30% buffer for lag/skill
HARD_CAP_PER_GAME = 300           // max points per game
DAILY_SCORE_CAP = 500             // max points per day
MIN_SECONDS_FOR_NONZERO_SCORE = 3 // need 3s to score
MIN_SECONDS_PER_POINT = 1.2       // each point needs 1.2s min
```

### Score Validation Logic (7 layers)
1. **Duration too short** (< 3s) → score = 0
2. **Duration too long** (> 300s) → warning only
3. **Score > 0 but < 3s** → score = 0
4. **Sanity check**: each point needs ≥ 1.2s
5. **Config-based max**: uses GAME_CONFIG (WIDTH, SANTA_X) + gameMechanics
6. **Daily cap**: 500 pts/day
7. **Negative score** → score = 0

### Config-Based Max Score Algorithm
```typescript
// 1. Time for first point (obstacle must travel to Santa)
tFirstPoint = (WIDTH - SANTA_X - obstacleWidth) / (obstacleSpeed * 60)

// 2. Points after first = remainingTime / avgSpawnInterval
// 3. theoreticalMax = 1 + possiblePointsAfterFirst
// 4. withBuffer = theoreticalMax * 1.3 (30%)
// 5. return min(withBuffer, 300)
```

### Database Columns (game_sessions)
- `game_token` - Server-generated UUID
- `status` - 'started' | 'processing' | 'finished' | 'invalid'
- `client_score` - What client sent (for logging)
- `validated_score` - What server validated (for leaderboard)
- `suspicion_reason` - Why flagged (if suspicious)
- `config_snapshot` - Game config at start time

### API Security Features
- **Rate limit** `/api/game/start`: 10 req/min per user
- **Rate limit** `/api/game/end`: 5 req/min per user
- **Open sessions limit**: Max 3 sessions with status='started' per user
- **Race condition fix**: Atomic UPDATE with status='processing' in /game/end

### Admin Panel
- URL: `/admin/suspicious`
- Features: View flagged sessions, invalidate cheaters, track stats

---

**Last Updated:** 2025-01-27 (Enhanced anti-cheat with config-based validation, rate limits, race condition fix)
**Verified Against:** Actual codebase analysis, not assumptions
