-- UR Version 2 migration
-- Run once in Supabase SQL Editor after deploying the Version 2 files.
-- Uses the existing student_progress row and its existing Row Level Security policies.
alter table public.student_progress
  add column if not exists learning_experience jsonb not null default '{}'::jsonb;
