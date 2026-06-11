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
