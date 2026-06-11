-- ============================================================
-- 001_initial_schema.sql
-- ============================================================

-- ────────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid references auth.users on delete cascade primary key,
  role        text check (role in ('coach', 'client')),
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

-- ────────────────────────────────────────────────
-- COACH PROFILES
-- ────────────────────────────────────────────────
create table if not exists coach_profiles (
  id                uuid references profiles on delete cascade primary key,
  sport             text not null,
  bio               text,
  hourly_rate       numeric,
  location          text,
  years_experience  int,
  intro_video_url   text,
  is_published      boolean default false,
  created_at        timestamptz default now()
);

alter table coach_profiles enable row level security;

create policy "Published coach profiles are viewable by everyone"
  on coach_profiles for select using (is_published = true);

create policy "Coaches can view their own unpublished profile"
  on coach_profiles for select using (auth.uid() = id);

create policy "Coaches can update their own profile"
  on coach_profiles for update using (auth.uid() = id);

create policy "Coaches can insert their own profile"
  on coach_profiles for insert with check (auth.uid() = id);

-- ────────────────────────────────────────────────
-- AVAILABILITY
-- ────────────────────────────────────────────────
create table if not exists availability (
  id           uuid primary key default gen_random_uuid(),
  coach_id     uuid references coach_profiles on delete cascade,
  day_of_week  int check (day_of_week between 0 and 6),
  start_time   time,
  end_time     time
);

alter table availability enable row level security;

create policy "Availability is publicly readable"
  on availability for select using (true);

create policy "Coaches can insert their own availability"
  on availability for insert with check (
    auth.uid() = coach_id
  );

create policy "Coaches can update their own availability"
  on availability for update using (
    auth.uid() = coach_id
  );

create policy "Coaches can delete their own availability"
  on availability for delete using (
    auth.uid() = coach_id
  );

-- ────────────────────────────────────────────────
-- STORAGE BUCKETS
-- Run these in Supabase Dashboard → Storage → New bucket,
-- OR via the Supabase CLI / API:
--
--   INSERT INTO storage.buckets (id, name, public)
--   VALUES ('coach-media', 'coach-media', true),
--          ('avatars', 'avatars', true)
--   ON CONFLICT DO NOTHING;
--
-- Storage RLS policies (add via Dashboard or SQL editor):
--
-- Policy: "Authenticated users can upload to coach-media"
--   bucket: coach-media | operation: INSERT
--   using: (auth.role() = 'authenticated')
--
-- Policy: "Authenticated users can upload to avatars"
--   bucket: avatars | operation: INSERT
--   using: (auth.role() = 'authenticated')
--
-- Both buckets are public=true so all objects are readable
-- without a policy (Supabase default public bucket behaviour).
-- ────────────────────────────────────────────────

-- Auto-create a profile row after a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
