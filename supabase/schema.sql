-- French A1.1 multi-user learning platform
-- Apply in Supabase SQL Editor. Uses only client-side publishable keys.
-- This schema is designed for Supabase Auth + row-level security (RLS).

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'teacher')),
  created_at timestamptz not null default now()
);

create table if not exists public.student_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  checks jsonb not null default '{}'::jsonb,
  weeks jsonb not null default '{}'::jsonb,
  notes text not null default '',
  last_section text not null default 'home',
  latest_quiz jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_key text not null,
  score integer not null check (score >= 0),
  max_score integer not null check (max_score > 0 and score <= max_score),
  percentage numeric(5,2) not null check (percentage >= 0 and percentage <= 100),
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create index if not exists quiz_attempts_user_submitted_idx
  on public.quiz_attempts (user_id, submitted_at desc);
create index if not exists student_progress_updated_idx
  on public.student_progress (updated_at desc);

-- Supabase Auth creates a profile with the student role for every new account.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'student'
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create or replace function public.sync_user_email_to_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
after update of email on auth.users
for each row when (old.email is distinct from new.email)
execute procedure public.sync_user_email_to_profile();

-- Policies are dropped before removing the old public helper, if a prior version existed.
drop policy if exists "profile owner or teacher can read profiles" on public.profiles;
drop policy if exists "students and teachers can read progress" on public.student_progress;
drop policy if exists "students can create own progress" on public.student_progress;
drop policy if exists "students can update own progress" on public.student_progress;
drop policy if exists "students and teachers can read quiz attempts" on public.quiz_attempts;
drop policy if exists "students can insert own quiz attempts" on public.quiz_attempts;

do $$
begin
  if to_regprocedure('public.is_teacher(uuid)') is not null then
    execute 'revoke all on function public.is_teacher(uuid) from public, anon, authenticated';
    execute 'drop function public.is_teacher(uuid)';
  end if;
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end $$;

-- Non-exposed helper: students cannot call this as a public REST RPC.
create or replace function private.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'teacher'
  );
$$;

revoke all on function private.is_teacher() from public, anon;
grant execute on function private.is_teacher() to authenticated;

alter table public.profiles enable row level security;
alter table public.student_progress enable row level security;
alter table public.quiz_attempts enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.student_progress from anon, authenticated;
revoke all on table public.quiz_attempts from anon, authenticated;

grant select on table public.profiles to authenticated;
create policy "profile owner or teacher can read profiles"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.is_teacher()));

grant select, insert, update on table public.student_progress to authenticated;
create policy "students and teachers can read progress"
on public.student_progress for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_teacher()));
create policy "students can create own progress"
on public.student_progress for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "students can update own progress"
on public.student_progress for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

grant select, insert on table public.quiz_attempts to authenticated;
create policy "students and teachers can read quiz attempts"
on public.quiz_attempts for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_teacher()));
create policy "students can insert own quiz attempts"
on public.quiz_attempts for insert to authenticated
with check (user_id = (select auth.uid()));

-- Trigger functions should not be callable directly by API roles.
revoke all on function public.handle_new_user_profile() from public, anon, authenticated;
revoke all on function public.sync_user_email_to_profile() from public, anon, authenticated;

-- Secure student speaking assessments. Recordings are private by default.
create table if not exists public.speaking_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_key text not null,
  prompt text not null,
  storage_path text not null unique,
  mime_type text not null default 'audio/webm',
  duration_seconds numeric(7,2) not null default 0 check (duration_seconds >= 0 and duration_seconds <= 300),
  submitted_at timestamptz not null default now(),
  teacher_feedback text not null default '',
  rubric_scores jsonb not null default '{}'::jsonb,
  score_total integer check (score_total is null or (score_total >= 0 and score_total <= 10)),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);
create index if not exists speaking_submissions_user_submitted_idx on public.speaking_submissions (user_id, submitted_at desc);
create index if not exists speaking_submissions_assessment_idx on public.speaking_submissions (assessment_key, submitted_at desc);
create index if not exists speaking_submissions_reviewed_by_idx on public.speaking_submissions (reviewed_by);
alter table public.speaking_submissions enable row level security;
revoke all on table public.speaking_submissions from anon, authenticated;
grant select, insert, delete on table public.speaking_submissions to authenticated;
grant update (teacher_feedback, rubric_scores, score_total, reviewed_at, reviewed_by) on table public.speaking_submissions to authenticated;
drop policy if exists "students and teachers can read speaking submissions" on public.speaking_submissions;
drop policy if exists "students can submit own speaking recordings" on public.speaking_submissions;
drop policy if exists "teachers can review speaking submissions" on public.speaking_submissions;
drop policy if exists "students can delete own speaking submissions" on public.speaking_submissions;
create policy "students and teachers can read speaking submissions" on public.speaking_submissions for select to authenticated using (user_id = (select auth.uid()) or (select private.is_teacher()));
create policy "students can submit own speaking recordings" on public.speaking_submissions for insert to authenticated with check (user_id = (select auth.uid()) and storage_path like ((select auth.uid())::text || '/%'));
create policy "students can delete own speaking submissions" on public.speaking_submissions for delete to authenticated using (user_id = (select auth.uid()));
create policy "teachers can review speaking submissions" on public.speaking_submissions for update to authenticated using ((select private.is_teacher())) with check ((select private.is_teacher()));
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('student-audio','student-audio',false,12582912,array['audio/webm','audio/mp4','audio/ogg','audio/wav','audio/mpeg']) on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "students upload own speaking audio" on storage.objects;
drop policy if exists "students and teachers read speaking audio" on storage.objects;
drop policy if exists "students delete own speaking audio" on storage.objects;
create policy "students upload own speaking audio" on storage.objects for insert to authenticated with check (bucket_id='student-audio' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "students and teachers read speaking audio" on storage.objects for select to authenticated using (bucket_id='student-audio' and ((storage.foldername(name))[1]=(select auth.uid())::text or (select private.is_teacher())));
create policy "students delete own speaking audio" on storage.objects for delete to authenticated using (bucket_id='student-audio' and (storage.foldername(name))[1]=(select auth.uid())::text);
