-- ============================================================
-- 018_prevent_booking_overlap.sql
-- Trigger to prevent a coach from being double-booked at the same
-- time slot. Guards INSERT + UPDATE and treats pending + confirmed
-- as blocking; cancelled bookings do not block a new one.
-- ⚠️ Run in Supabase SQL editor.
-- ============================================================

create or replace function public.prevent_booking_overlap()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('pending', 'confirmed') and exists (
    select 1 from public.bookings b
    where b.coach_id = new.coach_id
      and b.date = new.date
      and b.status in ('pending', 'confirmed')
      and b.id is distinct from new.id
      and (b.start_time, b.end_time) overlaps (new.start_time, new.end_time)
  ) then
    raise exception 'Booking conflict: this coach already has a booking that overlaps % – %', new.start_time, new.end_time
      using errcode = 'unique_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_booking_overlap on public.bookings;
create trigger trg_prevent_booking_overlap
  before insert or update on public.bookings
  for each row execute procedure public.prevent_booking_overlap();
