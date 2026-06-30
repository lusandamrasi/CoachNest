-- ============================================================
-- 011_client_profiles_backfill.sql
-- Ensure every client user has a client_profiles row so upsert
-- saves from the edit-profile form take the UPDATE path (which RLS
-- always allows for the row's own owner) rather than INSERT.
-- ⚠️ Run this in Supabase SQL editor before testing.
-- ============================================================

insert into public.client_profiles (id)
select p.id
from public.profiles p
left join public.client_profiles cp on cp.id = p.id
where p.role = 'client'
  and cp.id is null;
