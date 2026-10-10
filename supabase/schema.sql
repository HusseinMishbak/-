-- French A1.1 learning platform — Supabase schema
-- Run this entire file in Supabase Dashboard > SQL Editor > New query.
-- Never put a service_role/secret key in browser code. Use only a public anon/publishable key with these RLS policies.

create extension if not exists pgcrypto;

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

-- Every new signup receives a profile with role 'student', regardless of user-supplied metadata.
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
  on conflict (id) do update
    set email = excluded.email;
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

create or replace function public.is_teacher(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = check_user_id and p.role = 'teacher'
  );
$$;

revoke all on function public.is_teacher(uuid) from PUBLIC, anon;
grant execute on function public.is_teacher(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.student_progress enable row level security;
alter table public.quiz_attempts enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.student_progress from anon, authenticated;
revoke all on table public.quiz_attempts from anon, authenticated;

-- Students read their own profile; a teacher can read student profiles.
grant select on table public.profiles to authenticated;
drop policy if exists "profile owner or teacher can read profiles" on public.profiles;
create policy "profile owner or teacher can read profiles"
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_teacher(auth.uid()));

-- Deliberately no direct client INSERT/UPDATE/DELETE grants on profiles.
-- Therefore a student cannot change their role through the public API.

grant select, insert, update on table public.student_progress to authenticated;
drop policy if exists "students and teachers can read progress" on public.student_progress;
create policy "students and teachers can read progress"
on public.student_progress for select to authenticated
using (user_id = auth.uid() or public.is_teacher(auth.uid()));
drop policy if exists "students can create own progress" on public.student_progress;
create policy "students can create own progress"
on public.student_progress for insert to authenticated
with check (user_id = auth.uid());
drop policy if exists "students can update own progress" on public.student_progress;
create policy "students can update own progress"
on public.student_progress for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, insert on table public.quiz_attempts to authenticated;
drop policy if exists "students and teachers can read quiz attempts" on public.quiz_attempts;
create policy "students and teachers can read quiz attempts"
on public.quiz_attempts for select to authenticated
using (user_id = auth.uid() or public.is_teacher(auth.uid()));
drop policy if exists "students can insert own quiz attempts" on public.quiz_attempts;
create policy "students can insert own quiz attempts"
on public.quiz_attempts for insert to authenticated
with check (user_id = auth.uid());

-- After registering and confirming the teacher account, run a separate one-time command
-- in SQL Editor, replacing the example email:
-- update public.profiles set role = 'teacher' where lower(email) = lower('your-email@example.com');
