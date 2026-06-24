# CoachNest — Functionality Status

Last updated: 2026-06-24

## ✅ Currently Working

### Auth
- Email + password signup with role selection (coach / client) — `/auth/signup`
- Login — `/auth/login`
- Server-side session callback — `/auth/callback`
- Middleware redirects unauthenticated `/dashboard/*` access to `/auth/login`
- Sign-out via navbar (`components/auth/AuthButton.tsx`)
- Profile auto-creation via `handle_new_user` trigger (migrations 001 + 002)

### Landing page (`/`)
- Hero, How It Works, Sports Categories, CTA banner, Footer (all static marketing)
- **Featured Coaches** — server component, pulls top 3 most-recent published coaches from Supabase with avg rating + review count + verification badge. Empty state when no published coaches.
- Navbar reflects auth state and links to the correct dashboard

### Coach dashboard (`/dashboard/coach`)
- Role-gated server page
- 4-card grid: Edit Profile / Manage Availability / View Bookings / **Verification**
- Intro-video missing banner
- Booking calendar showing confirmed sessions (`components/coach/BookingCalender.tsx`)

### Edit Profile (`/dashboard/coach/edit-profile`)
- Basic info: name, location, sport, years experience, bio (500-char cap)
- Avatar upload (JPG/PNG/WebP, max 2MB) — `avatars` bucket
- Intro video upload (MP4/WebM/MOV, max 50MB) — `coach-media` bucket
- **Coaching details**: age-group multiselect, experience-level multiselect, coaching-type multiselect, language tag input
- **Pricing**: hourly rate (ZAR), session packages dynamic list, travel-radius slider 0–100km
- **Coaching photos**: up to 5 action shots (JPG/PNG/WebP, max 5MB each) — `coach-media/{user_id}/photos/`

### Verification (`/dashboard/coach/verification`)
- 4-step status row: Pending → ID Verified → Qualification Verified → Verified Coach
- SA ID / Passport upload (PDF/JPG/PNG, max 10MB) — `coach-documents/{user_id}/id.{ext}` (private bucket)
- Qualifications upload — multi-file (PDF/JPG/PNG, max 10MB each) — `coach-documents/{user_id}/qual_{n}_{ts}.{ext}`
- Declaration checkbox (gates submit)
- Submit sets `declaration_accepted`, `declaration_accepted_at`, `verification_status = 'pending'`
- Form locks after submission with Resubmit option

### Public coach discovery
- **`/coaches`** — server-rendered listing with sidebar filters (sport, location, experience levels, price min/max). Verification badges + ratings. Results query is server-side via URL params.
- **`/coaches/[id]`** — public coach profile: avatar (120px), name, sport, verification badge, bio, coaching types/age groups/languages/experience, hourly rate + packages table, travel radius, intro video, photo gallery, full 4-step verification ladder.
- **Reviews**: list of all reviews (avatar initial, name, stars, text, date), empty state, and a "Leave a review" form for authenticated `client` users only.
- **Report Coach**: subtle link at bottom opens shared `ReportModal` (reason dropdown + optional details, posts to `reports` table).

### Client dashboard (`/dashboard/client`)
- Role-gated shell
- My-bookings calendar

### Booking (partial — pre-existing)
- `/coaches` → coach card → `/booking/[coachId]` slot picker
- `/booking/my-bookings`
- Coach: `manage-availability` (set weekly slots + clients-per-slot), `manage-booking`

### Database / storage
- Tables: `profiles`, `coach_profiles` (extended), `availability`, `bookings`, `reviews`, `reports`
- Storage buckets: `avatars` (public), `coach-media` (public), `coach-documents` (private, RLS-scoped to owner via `(storage.foldername(name))[1] = auth.uid()::text`)
- RLS policies on all new tables

## 🔄 In Progress / Partial
- **Booking flow** — slot picker page and my-bookings calendar exist (pre-existing). Pre-existing TypeScript errors in `app/booking/[coachId]/page.tsx` and the dashboard bookings query typing; not touched in this iteration.
- **Verification review** — coach can submit, but there is no admin UI to advance `verification_status` past `'pending'`.
- **`coach-documents` bucket** — must be created manually in the Supabase dashboard (private) before migration 005 policies apply.

## 📋 TODO
- Terms & Conditions page + acceptance checkbox on signup
- Manual verification review (admin dashboard)
- Google Maps API — location search and radius filtering
- Booking flow — calendar, session confirmation, status updates
- Payment integration
- Email notifications for bookings and verification updates
- Admin dashboard — view reports, verify coaches, manage users, suspend accounts
- Push notifications
- Mobile app (Phase 3 — React Native)

## 🗂 Migration order

⚠️ Run migrations in this order in Supabase SQL editor: **003 → 004 → 005**

For migration 005, first create the `coach-documents` bucket in Supabase Dashboard → Storage with **Public: OFF**, then run the SQL policies.

## 🆕 New and modified files (this iteration)

**New**
- `supabase/migrations/003_extend_coach_profiles.sql`
- `supabase/migrations/004_reviews_reports.sql`
- `supabase/migrations/005_documents_bucket.sql`
- `app/coaches/[id]/page.tsx`
- `app/dashboard/coach/verification/page.tsx`
- `components/coach/VerificationForm.tsx`
- `components/coach/ReviewForm.tsx`
- `components/coach/ReportCoachButton.tsx`
- `components/shared/ReportModal.tsx`
- `FUNCTIONALITY.md`

**Modified**
- `app/coaches/page.tsx` — full rewrite as server component with sidebar filters
- `app/dashboard/coach/page.tsx` — added Verification card, switched to 4-col grid
- `app/dashboard/coach/edit-profile/page.tsx` — fetches new coach_profiles fields
- `components/coach/ProfileForm.tsx` — added Coaching Details / Pricing / Coaching Photos sections
- `components/landing/FeaturedCoaches.tsx` — removed all dummy data, now a live server component
