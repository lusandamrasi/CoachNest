-- ============================================================
-- 025_admin_document_access.sql
-- Allow admins to read all files in the private coach-documents
-- bucket, so the admin verification queue can generate signed
-- URLs for any coach's ID/qualification uploads.
-- ⚠️ Run in Supabase SQL editor before testing
-- ============================================================

create policy "Admins can read all coach documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'coach-documents'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
