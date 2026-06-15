-- ============================================================
-- 002_fix_auth_trigger.sql
--
-- Replaces the handle_new_user trigger so that signup metadata
-- (role, full_name, sport) is propagated into public.profiles
-- and, for coaches, public.coach_profiles. Errors are swallowed
-- so a trigger failure can never block auth.users insertion.
-- ============================================================

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

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

    if v_role = 'coach' then
      insert into public.coach_profiles (id, sport)
      values (new.id, v_sport)
      on conflict (id) do nothing;
    end if;
  exception when others then
    raise warning 'handle_new_user failed for user %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
