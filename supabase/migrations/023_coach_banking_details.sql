-- ============================================================
-- 023_coach_banking_details.sql
-- Stores coach payout banking details. Locked down with RLS so
-- only the owning coach can ever read or write their own row —
-- no public policy, admin/payouts access goes via the service
-- role key only.
-- ⚠️ Run in Supabase SQL editor.
-- ============================================================

create table if not exists public.coach_banking_details (
  id                  uuid primary key default gen_random_uuid(),
  coach_id            uuid references public.coach_profiles(id) on delete cascade not null unique,
  bank_name           text not null,
  branch_code         text,
  account_type        text not null
    check (account_type in ('Cheque/Current', 'Savings', 'Transmission')),
  account_number      text not null check (account_number ~ '^[0-9]+$'),
  account_holder_name text not null,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table public.coach_banking_details enable row level security;

create policy "Coaches can view their own banking details"
  on public.coach_banking_details for select
  to authenticated
  using (auth.uid() = coach_id);

create policy "Coaches can insert their own banking details"
  on public.coach_banking_details for insert
  to authenticated
  with check (auth.uid() = coach_id);

create policy "Coaches can update their own banking details"
  on public.coach_banking_details for update
  to authenticated
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

create policy "Coaches can delete their own banking details"
  on public.coach_banking_details for delete
  to authenticated
  using (auth.uid() = coach_id);

notify pgrst, 'reload schema';
