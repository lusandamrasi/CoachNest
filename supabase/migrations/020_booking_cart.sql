-- ============================================================
-- 020_booking_cart.sql
-- Adds payment_status to bookings for the cart-based checkout
-- flow. Coexists with the existing boolean `paid` column.
-- ⚠️ Run in Supabase SQL editor before testing.
-- ============================================================

alter table public.bookings
  add column if not exists payment_status text default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'paid'));
