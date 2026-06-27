-- ============================================================
-- 007_cosmetic_updates.sql
-- Cosmetic / contact updates: coach contact fields + review_text
-- ⚠️ Run this in Supabase SQL editor before testing
-- ============================================================

-- Add contact fields to coach_profiles
alter table public.coach_profiles
  add column if not exists email text,
  add column if not exists phone_number text;

-- Add review_text to reviews table if not already present
-- (already exists from migration 006_reviews_reports — kept here defensively)
alter table public.reviews
  add column if not exists review_text text;
