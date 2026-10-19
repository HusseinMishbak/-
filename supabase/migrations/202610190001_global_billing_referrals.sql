-- URFRE paid subscriptions and teacher referrals
-- Additive migration: does not remove or rewrite learning data.
begin;

alter table public.profiles
  add column if not exists referred_by_teacher_id uuid
  references public.profiles(id) on delete set null;

create table if not exists public.teacher_referral_codes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null unique references public.profiles(id) on delete cascade,
  code text not null unique check (code = upper(code) and length(code) between 5 and 32),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.student_referrals (
  student_id uuid primary key references auth.users(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  referral_code text not null,
  created_at timestamptz not null default now(),
  constraint student_referrals_not_self check (student_id <> teacher_id)
);
create index if not exists student_referrals_teacher_created_idx
  on public.student_referrals (teacher_id, created_at desc);

create table if not exists public.billing_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_checkout_session_id text,
  plan_key text,
  price_id text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_events (
  stripe_event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.teacher_referral_codes enable row level security;
alter table public.student_referrals enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.billing_events enable row level security;

revoke all on public.teacher_referral_codes from anon, authenticated;
revoke all on public.student_referrals from anon, authenticated;
revoke all on public.billing_subscriptions from anon, authenticated;
revoke all on public.billing_events from anon, authenticated;

grant select on public.teacher_referral_codes to authenticated;
grant select on public.student_referrals to authenticated;
grant select on public.billing_subscriptions to authenticated;

drop policy if exists "teacher can read own referral code" on public.teacher_referral_codes;
create policy "teacher can read own referral code"
  on public.teacher_referral_codes for select to authenticated
  using (teacher_id = (select auth.uid()));

drop policy if exists "student or referring teacher can read attribution" on public.student_referrals;
create policy "student or referring teacher can read attribution"
  on public.student_referrals for select to authenticated
  using (student_id = (select auth.uid()) or teacher_id = (select auth.uid()));

drop policy if exists "user can read own subscription" on public.billing_subscriptions;
create policy "user can read own subscription"
  on public.billing_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));

-- New sign-ups always receive the student role. A valid active teacher code only
-- records attribution; it never grants a teacher role, a discount, or paid access.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_teacher_id uuid;
begin
  v_code := upper(trim(coalesce(new.raw_user_meta_data ->> 'teacher_code', '')));
  if length(v_code) between 5 and 32 then
    select trc.teacher_id
      into v_teacher_id
      from public.teacher_referral_codes trc
     where trc.code = v_code
       and trc.is_active = true
     limit 1;
  end if;

  if v_teacher_id = new.id then
    v_teacher_id := null;
  end if;

  insert into public.profiles (id, email, full_name, role, referred_by_teacher_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'student',
    v_teacher_id
  )
  on conflict (id) do update
    set email = excluded.email;

  if v_teacher_id is not null then
    insert into public.student_referrals (student_id, teacher_id, referral_code)
    values (new.id, v_teacher_id, v_code)
    on conflict (student_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.handle_new_user_profile() from public, anon, authenticated;
grant execute on function public.handle_new_user_profile() to service_role;

commit;
