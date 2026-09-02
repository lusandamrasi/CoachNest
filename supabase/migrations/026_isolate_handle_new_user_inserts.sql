-- ============================================================
-- 026_isolate_handle_new_user_inserts.sql
--
-- handle_new_user() wrapped all three inserts (profiles,
-- coach_profiles, client_profiles) in a single exception block.
-- Because a failed statement rolls back everything already run
-- in that block, a downstream coach_profiles/client_profiles
-- insert failure silently rolled back the profiles insert too —
-- leaving the user fully signed up in auth.users but with NO
-- profiles row at all. Confirmed against production data: 23 of
-- 38 auth.users had no matching profiles row, including a real
-- account (not just test/seed accounts).
--
-- Fix: give each insert its own exception block (its own
-- savepoint), so a coach_profiles/client_profiles failure can
-- no longer take out the profiles row.
-- ⚠️ Run in Supabase SQL editor before testing.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role      text := new.raw_user_meta_data ->> 'role';
  v_full_name text := new.raw_user_meta_data ->> 'full_name';
  v_sport     text := coalesce(new.raw_user_meta_data ->> 'sport', '');
begin
  begin
    insert into public.profiles (id, full_name, role)
    values (new.id, v_full_name, v_role)
    on conflict (id) do update
      set full_name = excluded.full_name,
          role      = excluded.role;
  exception when others then
    raise warning 'handle_new_user: profiles insert failed for user %: %', new.id, sqlerrm;
  end;

  if v_role = 'coach' then
    begin
      insert into public.coach_profiles (id, sport)
      values (new.id, v_sport)
      on conflict (id) do nothing;
    exception when others then
      raise warning 'handle_new_user: coach_profiles insert failed for user %: %', new.id, sqlerrm;
    end;
  end if;

  if v_role = 'client' then
    begin
      insert into public.client_profiles (id)
      values (new.id)
      on conflict (id) do nothing;
    exception when others then
      raise warning 'handle_new_user: client_profiles insert failed for user %: %', new.id, sqlerrm;
    end;
  end if;

  return new;
end;
$$;
