-- ============================================================
-- 008_coach_location_coords.sql
-- Store latitude/longitude alongside the formatted location text
-- ⚠️ Run this in Supabase SQL editor before testing
-- ============================================================

alter table public.coach_profiles
  add column if not exists location_lat numeric,
  add column if not exists location_lng numeric;
