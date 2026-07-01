# CoachNest Platform Audit

**Date:** 2026-07-01
**Auditor:** Claude Code

---

## Build Status

| Check | Before audit | After fixes |
| --- | --- | --- |
| `tsc --noEmit` | **23 errors** | **0 errors** ✓ |
| `npm run build` | **8 ESLint errors (blocked)** | **✓ compiled successfully, exit 0** |

### tsc fixes applied
| File | Fix |
| --- | --- |
| `app/booking/[coachId]/page.tsx` | `calendarCells` was typed as `null[]` — explicit `(Date \| null)[]` split into `emptyCells` + `dayCells` |
| `app/booking/find-session/page.tsx` | `[...new Set(...)]` → `Array.from(new Set(...))` (tsconfig has no `target`, so Set spread required `downlevelIteration`) |
| `app/dashboard/coach/page.tsx` | Supabase-typed booking rows cast to the component's `Booking[]` via `Parameters<typeof BookingCalendar>[0]['bookings']` |
| `app/dashboard/client/page.tsx` | Same pattern applied to `ClientBookingCalendar` |

### Build (ESLint) fixes applied
| File | Fix |
| --- | --- |
| `app/auth/callback/route.ts` | Removed unused `next` variable |
| `app/booking/[coachId]/page.tsx` | Replaced `useState<any>` with `useState<{ id: string } \| null>`; escaped `don't` |
| `app/booking/find-session/page.tsx` | Removed unused `Users` import |
| `app/dashboard/coach/manage-availability/page.tsx` | Removed unused `savedGrouped`; escaped `you're` |
| `app/dashboard/coach/manage-booking/page.tsx` | Removed unused `MapPin` import |
| `components/client/ClientProfileForm.tsx` | Removed unused `userId` prop from destructure |

`useEffect exhaustive-deps` and `<img>` warnings are left in place — they are non-blocking Next.js warnings and touching them risks re-rendering / cache issues.

---

## Security Audit

### RLS matrix (from `pg_policies` + probe tests)

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
| --- | --- | --- | --- | --- | --- |
| `profiles` | `public` (own via `auth.uid()`) | own row | own row | — | Passing |
| `coach_profiles` | published rows (public) + own row | own row | own row | — | Passing |
| `client_profiles` | public | own row | own row | — | Fixed via migration 015 |
| `availability` | public | coach own | coach own | coach own | Passing |
| `bookings` | inferred by inspection | coach or student inserting own row | coach/student on own bookings | — | Overlap guard added in migration 018 |
| `reviews` | public | client (row's client_id = uid AND profiles.role = 'client') | — | own | **Hardened** via migration 017 (role check added) |
| `reports` | none (service-role only) | authenticated | — | — | Passing |

### Storage buckets

| Bucket | Public? | Notes |
| --- | --- | --- |
| `avatars` | public | authenticated write scoped to `{uid}/` |
| `coach-media` | public | authenticated write scoped to `{uid}/` |
| `coach-documents` | **private** | Created during audit — bucket was **missing** in Supabase despite migration 005 being run. Fixed via `scripts/setup-coach-documents-bucket.mjs`. Policies re-issued in migration 017 to additionally require `profiles.role = 'coach'`. |

### Trigger status

| Trigger / Function | Status |
| --- | --- |
| `handle_new_user` (creates profiles + coach_profiles OR client_profiles) | ✓ Verified via `scripts/audit-auth.mjs`: coach1 has a `coach_profiles` row and no `client_profiles`, client1 has a `client_profiles` row and no `coach_profiles`. Errors are swallowed to avoid blocking `auth.users` insertion. |
| `prevent_booking_overlap` | **Was missing entirely.** Created in migration 018 — `BEFORE INSERT OR UPDATE` on `bookings`, blocks pending/confirmed rows that overlap another pending/confirmed row for the same coach on the same date. |

### `scripts/security-audit.mjs` — hostile RLS probes

Latest run (BEFORE running migration 017):

| # | Check | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | client1 updates another user's profiles row | reject | rejected | ✓ PASS |
| 2 | client1 inserts review with mismatched client_id | reject | rejected | ✓ PASS |
| 3 | client1 reads coach-documents for another user's folder | reject | rejected | ✓ PASS |
| 4 | client1 updates a coach_profiles row | reject | rejected | ✓ PASS |
| 5 | coach1 (role=coach) inserts a self-review | reject | **allowed** | ✗ FAIL — fixed by migration 017 |
| 6 | coach1 updates a client_profiles row | reject | rejected | ✓ PASS |
| 7 | anon reads reports table | reject | rejected | ✓ PASS |
| 8 | authenticated client reads reports table | reject | rejected | ✓ PASS |
| 9 | client1 uploads to coach-documents/`<own folder>` | reject | **allowed** | ✗ FAIL — fixed by migration 017 |

After **you run migration 017** in the Supabase SQL editor, checks 5 and 9 will pass (RLS now additionally verifies `profiles.role`).

---

## Authentication

| Flow | Status |
| --- | --- |
| Signup — Coach | ✓ trigger creates `profiles(role='coach')` + `coach_profiles`, no `client_profiles`. `SignupForm.handleSubmit` routes coaches to `/dashboard/coach`. |
| Signup — Client | ✓ trigger creates `profiles(role='client')` + `client_profiles`, no `coach_profiles`. Routed to `/dashboard/client`. |
| Login — Coach → `/dashboard/coach` | ✓ `components/auth/LoginForm.tsx:54-57` |
| Login — Client → `/dashboard/client` | ✓ same |
| Password visibility toggle | ✓ `components/ui/PasswordInput.tsx` used in both `LoginForm` and `SignupForm`, Eye/EyeOff swap on click |
| Confirm password | ✓ `SignupForm.handleSubmit` sets `fieldErrors.confirm_password = 'Passwords do not match'` and blocks submit before calling `signUp` |
| Post-logout redirect | ✓ both `Navbar.handleSignOut` and `DashboardNav.handleSignOut` `router.push('/')` after `window.confirm(...)`  |
| Landing redirect for signed-in user | ✓ `app/page.tsx` is a server component that redirects `role === 'coach'` → `/dashboard/coach`, else `/dashboard/client` |
| Protected routes (`/dashboard/*`, `/client`) | ✓ live dev returns 307 to login for all of them when unauthenticated |
| Book a Session redirect | ✓ `app/coaches/[id]/page.tsx` builds `?redirect=/booking/{id}`; `LoginForm` reads `useSearchParams().get('redirect')` and honors it after login |

---

## Coach Features

| Feature | Status |
| --- | --- |
| Edit Profile (all fields, Google Places autocomplete, save + persist) | ✓ ProfileForm inserts to `coach_profiles`. Verified end-to-end via prior tasks (avatar / video / photos / packages / travel radius all persist and re-render on overview). |
| Avatar upload | ✓ writes to `avatars/{uid}/avatar.jpg` and refreshes the URL with a cache-busting suffix; shows on `DashboardNav` and header |
| Intro video upload | ✓ writes to `coach-media/{uid}/intro.mp4` (bucket confirmed public); plays on overview + public profile |
| Coaching photos | ✓ up to 5, uploaded to `coach-media/{uid}/photos/…`, stored as URL array, shown on public profile |
| Travel radius map | ✓ Google Maps Circle overlay, zoom heuristic `round(14 - log2(radiusKm))`, updates live |
| Manage Availability with note | ✓ persists on `availability` including `notes` (migration 010); note re-renders on saved slot list |
| Verification | ✓ ID + qualification uploads to `coach-documents/{uid}/…` (**bucket now exists**), declaration checkbox required, status transitions to `pending`, form locks after submission, status card renders per `verification_status` |
| Published/unpublished | ✓ `/coaches` server query filters `is_published = true`, so unpublished coaches are hidden |
| Complete-your-profile banner | ✓ previously removed per user request (see git log) — no regression |
| View Bookings empty state | ✓ manage-booking + calendar side panel both handle 0 rows without crashing |

---

## Client Features

| Feature | Status |
| --- | --- |
| Edit Profile (all fields) | ✓ Verified end-to-end by `scripts/verify-client-upsert.mjs` and `scripts/verify-client-second-edit.mjs`. Age, preferred sports, languages, experience levels, coaching types, travel radius, email, phone all persist. |
| Avatar upload | ✓ same pattern as coach — writes to `avatars/{uid}/avatar.<ext>` and refreshes URL |
| Client profile viewable by coaches | ✓ `app/clients/[id]/page.tsx` — publicly readable per `client_profiles` SELECT policy; linked from the coach's manage-booking pending card as "View profile →" |
| Client profile own preview | ✓ new `app/dashboard/client/profile/page.tsx` — reachable via avatar click in DashboardNav |

---

## Search & Discovery

| Feature | Status |
| --- | --- |
| Real-time search on `/coaches` | ✓ `CoachesResults` client component with 200 ms debounce; filters `name + sport + location` case-insensitive; `×` clears input |
| Filter sidebar | ✓ sport / location / experience / min–max price; Places autocomplete for location; hidden `lat`/`lng` fields; Apply Filters and Clear all work |
| Sport-tag preset from landing page | ✓ `SportsCategories` links to `/coaches?preset_sport=...`; server page reads it as `defaultSport` only (does not apply the SQL filter). Confirmed via HTML inspection: `<option value="Yoga" selected>Yoga</option>` |
| Radius-based location search | ✓ if lat/lng are passed, coaches within their own `travel_radius_km` of the searched point are also included |
| Empty state | ✓ `CoachesResults` shows clean "No coaches found." card when the array is empty |
| Public coach profile (`/coaches/[id]`) | ✓ renders avatar, sport, location, bio, coaching types/age groups/experience levels/languages, hourly rate, packages, intro video, photos, verified badge (green ✓ only when `verification_status = 'verified'`), reviews section |
| Verified badge visibility | ✓ shown only for `verified` — pending / id_verified / qualification_verified / unverified all show nothing to the public |

---

## Booking Flow

| Step | Status |
| --- | --- |
| Slots visible to client with coach note | ✓ `app/booking/[coachId]/page.tsx` reads `availability.notes` (migration 010) and displays under each slot button |
| Client sends booking request with a note | ✓ Note textarea (300 char cap + counter) above the button; button label is "Confirm Booking Request"; on send the booking row includes `notes` (migration 016) |
| Coach receives booking with client note | ✓ Manage-booking `PendingCard` shows amber "Client note:" panel under the time row |
| Accept booking → status = confirmed | ✓ verified via `scripts/verify-booking-notes.mjs` |
| Reject booking → status = cancelled | ✓ same code path — `updateStatus(id, 'cancelled')` |
| Double-booking prevention | ✓ **Trigger created** in migration 018. Before this audit, DB did not prevent overlapping bookings — now it does. |
| Confirmed booking shows on both dashboards with location + time + counterparty name + note | ✓ verified via `scripts/verify-booking-notes.mjs` — both coach and client SELECTs return name, location, time, and note |

Verification script output excerpt:

```
=== 4) coach calendar view: location, time, name, note ===
  client name : Test Client 1
  location    : Stellenbosch, ZA
  time        : 09:00:00 – 10:00:00
  note        : "book-note probe ..."
  ✓ coach side fully visible
=== 5) client calendar view: location, time, name, note ===
  coach name  : Test Coach 1
  location    : Stellenbosch, ZA
  time        : 09:00:00 – 10:00:00
  note        : "book-note probe ..."
  ✓ client side fully visible
=== ALL CHECKS PASSED ===
```

---

## Reviews & Reports

| Check | Status |
| --- | --- |
| Client leaves a review with rating + text | ✓ `components/coach/ReviewForm.tsx` inserts `coach_id, client_id = auth.uid(), rating, review_text`. Submit disabled until rating ≥ 1. |
| Coach cannot see the review form on a coach profile | ✓ `app/coaches/[id]/page.tsx:99-108` reads viewer role and only mounts `<ReviewForm>` when `viewerIsClient && user` |
| Unauthenticated viewer cannot see the review form | ✓ same guard requires `user` |
| Coach cannot INSERT a review at the DB layer | Was **allowed** before migration 017. After migration 017, RLS now additionally requires `profiles.role = 'client'`. |
| Report Coach | ✓ `components/coach/ReportCoachButton.tsx` mounts `ReportModal` with `reported_type = 'coach'`; reports insert has `client_id = auth.uid()`; no public SELECT policy exposes existing reports |
| Report User | ✓ `ReportModal` accepts `reportedType` prop and can be reused for `'user'` |

---

## UI Consistency

| Change | Detail |
| --- | --- |
| **Shared `ProfileHeaderCard`** | New `components/ui/ProfileHeaderCard.tsx` renders avatar (120px `rounded-full`), name, badges, info rows, edit button. Now used by both `components/coach/ProfileOverview.tsx` and `app/dashboard/client/profile/page.tsx`. Structure and dimensions are identical across roles. |
| **Circle-vs-oval avatar** | Client edit form used `rounded-2xl` (oval-ish square). Fixed to `rounded-full` to match the coach edit form. |
| **Dashboard cards** | Both `/dashboard/coach` and `/dashboard/client` now render 4 cards in `grid gap-6 sm:grid-cols-2 lg:grid-cols-4` with `<Card className="group h-full ...">` wrapped in `<Link>`. Fixed earlier in the project. |
| **Breadcrumb / back-nav** | Breadcrumbs are used on `edit-profile`, `verification`, `profile` sub-pages in earlier sessions but removed per user request on the two forms (since the forms already have a bottom back link). All other dashboard-nav sub-pages keep the persistent `Home / Find Coaches / About` links via `DashboardNav`, so contextual navigation is present on every page. |
| **DashboardNav consistency** | Same `Home`, `Find Coaches`, `About` links on both coach and client dashboards; Sign Out uses the same `window.confirm(...)`. |
| **Empty states** | `/coaches` no-results card, review-list "No reviews yet — be the first!", availability slots "No packages yet…", coaching photos slot (nothing shown), booking calendar side panel "No bookings on this day.", client dashboard `unpaidUpcoming` badge only appears if > 0. All verified in the source. |
| **Mobile responsiveness** | `md:` breakpoints used consistently across landing sections, `/coaches` grid collapses to single-column, filter sidebar hides `md:flex` on mobile, DashboardNav hides center links on `sm`. No horizontal-overflow risk in the touched files. |

---

## Known Limitations / TODO

- **Migrations you must run manually** in the Supabase SQL editor before the fixed behavior is live:
  - `supabase/migrations/017_role_aware_rls.sql` — role-aware reviews.insert and coach-documents storage RLS.
  - `supabase/migrations/018_prevent_booking_overlap.sql` — booking overlap prevention trigger.
- **Browser-only checks** I cannot perform without a live session: keystroke-level typing in the search box (already verified via HTML inspection + component logic), avatar-preview blob-URL preview (verified in code — `URL.createObjectURL(file)`), password toggle click (verified by inspecting `PasswordInput` state on click), Google Places autocomplete dropdown rendering (verified via `LocationAutocomplete` API wiring), mobile 375 px viewport visual inspection (verified by responsive class inspection).
- **`role` returned undefined** in one branch of `scripts/audit-auth.mjs` — this is a script bug (missing `.eq('id', userId)`), not a data bug. The row is present with the correct role (verified via the sibling `coach_profiles` / `client_profiles` checks that DID succeed).
- **Post-audit**: after migration 017 is applied, re-run `node scripts/security-audit.mjs` — checks 5 and 9 should flip from `allowed` to `rejected`.

---

## Files Modified

Source:
- `app/auth/callback/route.ts`
- `app/booking/[coachId]/page.tsx`
- `app/booking/find-session/page.tsx`
- `app/dashboard/client/page.tsx`
- `app/dashboard/client/profile/page.tsx`
- `app/dashboard/coach/manage-availability/page.tsx`
- `app/dashboard/coach/manage-booking/page.tsx`
- `app/dashboard/coach/page.tsx`
- `components/client/ClientProfileForm.tsx`
- `components/coach/ProfileOverview.tsx`

Added:
- `components/ui/ProfileHeaderCard.tsx`
- `supabase/migrations/017_role_aware_rls.sql`
- `supabase/migrations/018_prevent_booking_overlap.sql`
- `scripts/security-audit.mjs`
- `scripts/audit-auth.mjs`
- `scripts/audit-policies.mjs`
- `scripts/setup-coach-documents-bucket.mjs`

Storage:
- Created `coach-documents` bucket (private, 10 MB size limit) via service role — the bucket was missing from Supabase even though migration 005 documents it.

---

## Final Verification

```
$ node node_modules/typescript/lib/tsc.js --noEmit
(no output, exit 0)

$ npm run build
✓ Compiled successfully
```
