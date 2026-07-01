-- ============================================================
-- 017_role_aware_rls.sql
-- Two role-aware hardening steps surfaced by the security audit:
--   1) Coaches must not be able to insert reviews.
--   2) Only users with profiles.role = 'coach' may upload/read
--      objects in the private coach-documents bucket.
-- ⚠️ Run in Supabase SQL editor.
-- ============================================================

-- ── 1. reviews.insert: client_id must be the caller AND that caller
--       must have profiles.role = 'client'.
drop policy if exists "Clients can insert reviews" on public.reviews;

create policy "Clients can insert reviews"
  on public.reviews for insert
  to authenticated
  with check (
    auth.uid() = client_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'client'
    )
  );

-- ── 2. coach-documents storage: require role = 'coach' AND folder = uid
drop policy if exists "Coaches upload own documents" on storage.objects;
drop policy if exists "Coaches read own documents"   on storage.objects;

create policy "Coaches upload own documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'coach-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'coach'
    )
  );

create policy "Coaches read own documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'coach-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'coach'
    )
  );

notify pgrst, 'reload schema';
