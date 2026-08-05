-- ============================================================
-- 024_fix_booking_overlap_trigger.sql
-- Two bugs found while debugging "confirm booking" / "cancel
-- booking" failing with a 500:
--
-- 1. prevent_booking_overlap() (from 018_prevent_booking_overlap.sql)
--    reads `a.selected_clients` from public.availability, but that
--    column has never existed — the real column (used everywhere
--    else in the app) is `num_clients`. Any insert/update that hit
--    this branch (new.status in ('pending','confirmed')) with a
--    matching availability row would raise
--    "column a.selected_clients does not exist".
--
-- 2. There is a second, older, undocumented trigger on
--    public.bookings — `prevent_booking_overlap` (trigger name)
--    calling a `check_booking_overlap()` function — that predates
--    this migration file and was never dropped when the current
--    trigger/function pair (`trg_prevent_booking_overlap` /
--    prevent_booking_overlap()) was introduced. It isn't defined in
--    any migration in this repo, so its exact logic can't be
--    reviewed here; having two overlap-prevention triggers race on
--    every insert/update is redundant at best. It's dropped below
--    in favour of the single, corrected trigger from this file.
--
-- ⚠️ Run in Supabase SQL editor.
-- ============================================================

-- Drop the legacy/orphaned trigger + function (if present).
drop trigger if exists prevent_booking_overlap on public.bookings;
drop function if exists public.check_booking_overlap() cascade;

-- Re-create the real overlap-prevention function with the correct
-- column name.
create or replace function public.prevent_booking_overlap()
returns trigger
language plpgsql
as $$
declare
  existing_count int;
  allowed_count int;
begin
  if new.status in ('pending', 'confirmed') then

    -- Get the max clients allowed for this slot from availability
    select coalesce(a.num_clients, 1)
    into allowed_count
    from public.availability a
    where a.coach_id = new.coach_id
      and a.day_of_week = extract(dow from new.date)::int
      and a.start_time = new.start_time
      and a.end_time = new.end_time
    limit 1;

    allowed_count := coalesce(allowed_count, 1);

    -- Count existing bookings for this exact slot
    select count(*)
    into existing_count
    from public.bookings b
    where b.coach_id = new.coach_id
      and b.date = new.date
      and b.status in ('confirmed')
      and b.id is distinct from new.id
      and (b.start_time, b.end_time) overlaps (new.start_time, new.end_time);

    -- Block if slot is already at capacity
    if existing_count >= allowed_count then
      raise exception 'Booking conflict: this slot is full (% / % clients booked) for % – %',
        existing_count, allowed_count, new.start_time, new.end_time
        using errcode = 'unique_violation';
    end if;

  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_booking_overlap on public.bookings;
create trigger trg_prevent_booking_overlap
  before insert or update on public.bookings
  for each row execute procedure public.prevent_booking_overlap();
