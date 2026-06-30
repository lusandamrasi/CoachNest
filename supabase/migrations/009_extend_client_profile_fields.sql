-- ============================================================
-- 009_extend_client_profile_fields.sql
-- Expand client_profiles to mirror coach-side preferences and coords
-- ⚠️ Run this in Supabase SQL editor before testing
-- ============================================================

alter table public.client_profiles
  add column if not exists age              int,
  add column if not exists preferred_sports text[],
  add column if not exists languages_spoken text[],
  add column if not exists experience_levels text[],
  add column if not exists coaching_types   text[],
  add column if not exists travel_radius_km int,
  add column if not exists location_lat     numeric,
  add column if not exists location_lng     numeric,
  add column if not exists email            text,
  add column if not exists phone_number     text;
