-- ============================================================
-- 004_reviews_reports.sql
-- Create reviews and reports tables
-- ⚠️ Run in Supabase SQL editor before deploying
-- ============================================================

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid references public.coach_profiles(id) on delete cascade,
  client_id   uuid references public.profiles(id) on delete set null,
  rating      int check (rating between 1 and 5),
  review_text text,
  created_at  timestamptz default now()
);

alter table public.reviews enable row level security;

create policy "Anyone can read reviews"
  on public.reviews for select using (true);

create policy "Clients can insert reviews"
  on public.reviews for insert
  to authenticated
  with check (auth.uid() = client_id);

create policy "Clients can delete own reviews"
  on public.reviews for delete
  to authenticated
  using (auth.uid() = client_id);


create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid references public.profiles(id) on delete set null,
  reported_id   uuid references public.profiles(id) on delete cascade,
  reported_type text check (reported_type in ('coach', 'user')),
  reason        text not null,
  details       text,
  status        text default 'open'
    check (status in ('open','reviewed','resolved')),
  created_at    timestamptz default now()
);

alter table public.reports enable row level security;

create policy "Authenticated users can submit reports"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

-- Only service role can read reports (admin only — no select policy for public)
