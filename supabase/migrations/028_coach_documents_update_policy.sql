-- ============================================================
-- 028_coach_documents_update_policy.sql
--
-- "Replace ID document" was failing with a 403 RLS error. The
-- upload path is deterministic (`${userId}/id.${ext}`), so
-- re-uploading over an existing ID doc hits the storage API's
-- upsert path, which Supabase Storage executes as an UPDATE on
-- the existing storage.objects row — not an INSERT. Only an
-- INSERT policy existed (017_role_aware_rls.sql), so every
-- replace was rejected. Add the matching UPDATE policy.
-- ⚠️ Run in Supabase SQL editor before testing.
-- ============================================================

create policy "Coaches update own documents"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'coach-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'coach'
    )
  )
  with check (
    bucket_id = 'coach-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'coach'
    )
  );
