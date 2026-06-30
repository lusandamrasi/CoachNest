-- ============================================================
-- 010_availability_notes.sql
-- Optional per-slot notes coaches can share with clients
-- ⚠️ Run this in Supabase SQL editor before testing
-- ============================================================

alter table public.availability
  add column if not exists notes text;
