-- ============================================================
-- 022_favorites.sql
-- Lets any logged-in user (coach or client) save/unsave a coach
-- profile to their favorites list.
-- ⚠️ Run in Supabase SQL editor.
-- ============================================================

create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  coach_id    uuid references public.coach_profiles(id) on delete cascade not null,
  created_at  timestamptz default now(),
  unique (user_id, coach_id)
);

alter table public.favorites enable row level security;

create policy "Users can view their own favorites"
  on public.favorites for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own favorites"
  on public.favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own favorites"
  on public.favorites for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists favorites_user_id_idx on public.favorites(user_id);
create index if not exists favorites_coach_id_idx on public.favorites(coach_id);

notify pgrst, 'reload schema';
