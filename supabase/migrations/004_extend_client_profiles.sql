-- ============================================================
-- 004_extend_client_profiles.sql
-- Extend client_profiles with new fields
-- ⚠️ Run in Supabase SQL editor before deploying
-- ============================================================

alter table client_profiles
  add column if not exists bio         text,
  add column if not exists rating      integer default 3,
  add column if not exists location    text,
  add column if not exists is_parent   boolean;