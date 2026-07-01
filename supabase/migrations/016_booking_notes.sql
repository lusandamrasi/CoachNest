-- ============================================================
-- 016_booking_notes.sql
-- Optional note clients can attach to a booking request. Coaches
-- see it on the accept/reject card; both sides see it on the
-- confirmed-booking calendar.
-- ⚠️ Run this in the Supabase SQL editor before testing.
-- ============================================================

alter table public.bookings
  add column if not exists notes text;
