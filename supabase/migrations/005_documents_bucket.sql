-- ============================================================
-- 005_documents_bucket.sql
-- ⚠️ Run in Supabase SQL editor before deploying
--
-- MANUAL STEP FIRST:
-- Go to Supabase Dashboard → Storage → New bucket
--   Name: coach-documents
--   Public: OFF (private)
-- Then run the policies below.
-- ============================================================

create policy "Coaches upload own documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'coach-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Coaches read own documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'coach-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
