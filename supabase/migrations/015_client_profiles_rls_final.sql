-- ============================================================
-- 015_client_profiles_rls_final.sql
-- Diagnosed via reproducible script: the user's own JWT works
-- fine on profiles (SELECT + UPDATE both succeed with auth.uid()
-- = id), but every operation on client_profiles is rejected by
-- RLS — proving an undocumented / RESTRICTIVE policy exists on
-- client_profiles that 013 did not drop. This migration nukes
-- EVERY policy on the table via a DO block, re-grants base
-- privileges, and recreates exactly the policies we want.
--
-- ⚠️ Run this in the Supabase SQL editor before testing.
-- ============================================================

-- Make sure RLS is on (not forced — we don't want to lock owner)
alter table public.client_profiles enable row level security;

-- Drop EVERY existing policy on client_profiles, by name, no
-- matter who created it (migration, dashboard UI, etc.).
do $$
declare
  r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'client_profiles'
  loop
    execute format('drop policy if exists %I on public.client_profiles', r.policyname);
  end loop;
end $$;

-- Re-grant the base table privileges the policies depend on.
grant select, insert, update on public.client_profiles to authenticated;
grant select                  on public.client_profiles to anon;

-- SELECT: public profile data is readable by anyone (coaches need
-- to preview clients before accepting bookings).
create policy "Client profiles are viewable by everyone"
  on public.client_profiles for select
  to public
  using (true);

-- INSERT: a signed-in user can create only their own row.
create policy "Clients can insert own profile"
  on public.client_profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- UPDATE: a signed-in user can update only their own row.
-- Both USING (which row can be targeted) and WITH CHECK (what
-- the post-update row must look like) are required for upsert
-- via PostgREST ON CONFLICT to take the UPDATE path.
create policy "Clients can update own profile"
  on public.client_profiles for update
  to authenticated
  using      (auth.uid() = id)
  with check (auth.uid() = id);

-- Tell PostgREST to drop its policy cache immediately.
notify pgrst, 'reload schema';
