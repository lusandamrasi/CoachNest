-- ============================================================
-- 003_extend_coach_profiles.sql
-- Extend coach_profiles with new fields
-- ⚠️ Run in Supabase SQL editor before deploying
-- ============================================================

alter table public.coach_profiles
  add column if not exists age_groups_coached      text[]      default '{}',
  add column if not exists experience_levels       text[]      default '{}',
  add column if not exists coaching_types          text[]      default '{}',
  add column if not exists languages_spoken        text[]      default '{}',
  add column if not exists session_packages        jsonb       default '[]',
  add column if not exists travel_radius_km        int         default 0,
  add column if not exists coaching_photos         text[]      default '{}',
  add column if not exists id_document_url         text,
  add column if not exists qualifications_url      text[]      default '{}',
  add column if not exists declaration_accepted    boolean     default false,
  add column if not exists declaration_accepted_at timestamptz,
  add column if not exists verification_status     text        default 'unverified',
  add column if not exists is_suspended            boolean     default false;

alter table public.coach_profiles
  add constraint coach_profiles_verification_status_check
  check (verification_status in (
    'unverified','pending','id_verified','qualification_verified','verified'
  ));
