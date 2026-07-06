-- ============================================================
-- 019_publish_coaches_by_default.sql
--
-- New coaches should be visible on /coaches immediately after
-- signup. Previously coach_profiles.is_published defaulted to
-- false and nothing in the app ever flipped it, so brand-new
-- coaches never appeared. Flip the default and backfill.
-- ⚠️ Run in Supabase SQL editor.
-- ============================================================

alter table public.coach_profiles
  alter column is_published set default true;

update public.coach_profiles
  set is_published = true
  where is_published = false;
