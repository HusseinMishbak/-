-- Follow-up indexes and least-privilege webhook event ledger policy.
begin;

create index if not exists profiles_referred_by_teacher_idx
  on public.profiles (referred_by_teacher_id);

grant select, insert on public.billing_events to service_role;
drop policy if exists "service role manages webhook event ledger" on public.billing_events;
create policy "service role manages webhook event ledger"
  on public.billing_events for all to service_role
  using (true) with check (true);

commit;
