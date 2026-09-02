-- ============================================================
-- 027_enable_coach_profiles_realtime.sql
--
-- CoachVerificationQueue.tsx subscribes to postgres_changes UPDATE
-- events on public.coach_profiles to auto-refresh the admin queue.
-- Confirmed via live test that zero events were received for any
-- row — coach_profiles was never added to the supabase_realtime
-- publication, so no change events are broadcast for it at all
-- (this is a per-table opt-in, not automatic).
-- ⚠️ Run in Supabase SQL editor before testing.
-- ============================================================

alter publication supabase_realtime add table public.coach_profiles;
