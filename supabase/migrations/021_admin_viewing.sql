-- ============================================================
-- 021_admin_viewing.sql
-- Gives admins the right to view reports and sessions
-- ⚠️ Run in Supabase SQL editor before testing.
-- ============================================================
create policy "Admins can read all bookings"
  on bookings for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can read all reports"
  on reports for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );