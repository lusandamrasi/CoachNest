# CoachNest

A sports coaching marketplace where coaches create profiles and clients discover and book them.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase

---

## Getting Started (Co-dev Setup)

### 1. Check Git is installed

```bash
git --version
```

### 2. Set up SSH key for GitHub (once, on your machine)

```bash
ssh-keygen -t ed25519 -C "your@email.com"
```

Hit enter through all prompts (no passphrase needed). Then:

```bash
cat ~/.ssh/id_ed25519.pub
```

Copy the output → go to GitHub → **Settings → SSH and GPG Keys → New SSH Key** → paste it in.

### 3. Test it works

```bash
ssh -T git@github.com
```

Should say: `Hi username! You've successfully authenticated.`

### 4. Clone the repo

```bash
git clone git@github.com:lusandamrasi/CoachNest.git
cd CoachNest
```

### 5. Install dependencies

```bash
npm install
```

### 6. Create your `.env.local` file

Create a file called `.env.local` in the project root and paste in exactly this:

```
NEXT_PUBLIC_SUPABASE_URL=https://dcnrueeyodwbxbzqppye.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjbnJ1ZWV5b2R3YnhienFwcHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzEwNjQsImV4cCI6MjA5Njc0NzA2NH0._OPEJXdCTbyR1DgbKAbwLMGLJY78lMzNOBo12D4iOUc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjbnJ1ZWV5b2R3YnhienFwcHllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE3MTA2NCwiZXhwIjoyMDk2NzQ3MDY0fQ.tHXRfslfoDX_HyFAGLsnECUOeDTL1ShDF441Dgp7r0U
```

### 7. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 8. Daily workflow

```bash
git pull origin main        # always do this first before starting work
# ... make changes ...
git add .
git commit -m "what you did"
git push origin main
```

---

> **Note for Node v24+ users:** Node v24 has a known issue where `node_modules/.bin` wrapper scripts break. The `npm run dev` script in this project already works around this — no extra steps needed.

---

## Why pushes keep breaking the build even though `npm run dev` "works"

If a co-dev can run the app locally, click around, confirm their feature works, push — and it still fails to build, this is why:

**`npm run dev` and `npm run build` check different things.**

- `npm run dev` starts the dev server only. It does *not* run ESLint across the project, and TypeScript errors only surface as a browser overlay on the specific page you happen to be viewing. A page can render and "work" in the browser while sitting on unused imports, `any` casts, or unescaped `'`/`"` in JSX — none of that stops the dev server.
- `npm run build` (what actually runs before every deploy) does a full production build: it type-checks the *entire* project and lints every file. In this repo's ESLint config (`eslint-config-next`), rules like `@typescript-eslint/no-unused-vars`, `@typescript-eslint/no-explicit-any`, and `react/no-unescaped-entities` are set to **error**, not warning — so one leftover unused variable or `any` anywhere in the repo fails the whole build, even in a file the current PR didn't touch.

That gap is exactly why this keeps repeating: testing in the browser only exercises `npm run dev`'s checks, never `npm run build`'s. Warnings (missing `useEffect` deps, `<img>` vs `next/image`) don't block the build — only the `Error:` lines do.

### The fix — run this before every push

```bash
npm run build
```

If it fails, the output tells you exactly which rule and which `file:line` broke it. Fix those, re-run, and don't push until it prints `✓ Compiled successfully`.

### Making it automatic (recommended)

Relying on remembering to run `npm run build` before every push doesn't scale. The reliable fix is a `pre-push` git hook (e.g. via [Husky](https://typicode.github.io/husky/)) that runs `npm run build` automatically and blocks the push if it fails — so a broken build never leaves a co-dev's machine in the first place. Ask if you'd like this set up.

---

## Routes

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/auth/login` | Sign in |
| `/auth/signup` | Create account (choose Coach or Client role) |
| `/auth/callback` | OAuth/magic-link callback handler |
| `/coaches` | Coach listing (shell — search/filter coming soon) |
| `/dashboard/coach` | Coach dashboard (protected) |
| `/dashboard/client` | Client dashboard (protected) |

Dashboard routes redirect to `/auth/login` when not authenticated.

---

## Auth flow

- **Sign up** — choose a role (Coach or Client). A `profiles` row is created automatically. Coaches also get a blank `coach_profiles` row.
- **Sign in** — after login, coaches are redirected to `/dashboard/coach` and clients to `/dashboard/client`.
- **Sign out** — click the Sign Out button in the dashboard header.

---

## Bookings pages — tabs & tags (for reference)

The booking status model has two independent axes: `status` (`pending` / `confirmed` / `cancelled` / `review` / `completed` / `completed-unpaid`) and `paid` (boolean, whether the client has paid). The tabs and tags below are just different views/labels over those two columns — no new DB fields were added for this.

### Client — `/booking/my-bookings`

Tabs, left to right: **Upcoming, Pending Confirmation, Confirmed, Cancelled, All**

| Tab | Shows | Tag on each card |
|---|---|---|
| Upcoming | `status = confirmed`, `paid = true`, date is today or later | — |
| Pending Confirmation | `status = pending`, date is today or later (past-dated requests are hidden here) | "Pending Confirmation" (amber) |
| Confirmed | `status = confirmed`, date is today or later — **regardless of paid** | "Payment Pending" (amber) or "Paid" (green). Payment-pending items are sorted first. |
| Cancelled | `status = cancelled` | "Cancelled" (red) |
| All | every booking, no date or status filtering (includes past) | whichever tag applies |

Notes:
- The number badge on the **Confirmed** tab is the count of `confirmed + unpaid + upcoming` bookings — deliberately the same query `lib/hooks/useCart.ts` uses for the cart, so that number always matches the cart icon's badge in the navbar.
- A confirmed-but-unpaid booking that's now in the past drops out of "Confirmed" and only shows under "All" (still with its "Payment Pending" tag).
- **Payment only happens through the cart now** — there is no "Pay now" button on individual booking cards anymore (it was removed from every tab, including "All"). Clients pay via the cart icon in the navbar → checkout.
- "Cancel" button appears on a card when `status = confirmed && paid = false` (upcoming only) — cancelling a paid or already-past booking isn't offered here.

### Coach — `/dashboard/coach/manage-booking`

Tabs: **Requests, Upcoming, To Review, Past, Cancelled**

- Requests = pending bookings awaiting Accept/Decline.
- Upcoming/Past mirror the client's confirmed/past logic.
- **Cancelled** is new — shows every booking with `status = cancelled` for that coach (same card styling/behavior as the client's Cancelled tab).
- Confirmed bookings show the same "Payment Pending" / "Paid" tag as the client side (kept in sync intentionally — same wording, same colors).
- Coaches get the same "Cancel session" button as clients, for `confirmed && unpaid` upcoming bookings.

### Cancelling a booking

Both the client and coach Cancel buttons call `POST /api/bookings/cancel` (not a direct DB write from the browser). That route re-checks server-side that the booking is `confirmed` and `paid = false` before cancelling, and only allows the request if the caller is the booking's coach or student — so it can't be bypassed by tampering with the UI.

---

## Project structure

```
app/
  auth/login         Sign-in page
  auth/signup        Registration page
  auth/callback      Auth redirect handler
  dashboard/coach    Coach dashboard (protected)
  dashboard/client   Client dashboard (protected)
  coaches/           Coach listing shell
  page.tsx           Landing page
components/
  auth/              LoginForm, SignupForm, AuthButton
  landing/           Hero, HowItWorks, SportsCategories, FeaturedCoaches, CTABanner
  layout/            Navbar, Footer
  ui/                Button, Card, Input, Badge
lib/
  supabase/          client.ts (browser), server.ts (server components)
  validations/       Zod schemas for auth forms
  types/             TypeScript interfaces
supabase/
  migrations/        001_initial_schema.sql
middleware.ts        Session refresh + route protection
```

---

## Not yet built

- Booking and payment flows
- Coach profile edit page
- Coach search and filter
- Video upload UI
- Review system
