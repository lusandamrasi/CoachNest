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
declare
  existing_count int;
  allowed_count int;
begin
  if new.status in ('pending', 'confirmed') then

    -- Get the max clients allowed for this slot from availability
    select coalesce(a.selected_clients, 1)
    into allowed_count
    from public.availability a
    where a.coach_id = new.coach_id
      and a.day_of_week = extract(dow from new.date)::int
      and a.start_time = new.start_time
      and a.end_time = new.end_time
    limit 1;

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
