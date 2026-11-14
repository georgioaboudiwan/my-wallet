create table if not exists public.report_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  sent_at timestamptz not null default now(),
  primary key (user_id, month)
);
alter table public.report_log enable row level security;
revoke all on public.report_log from anon, authenticated;
grant select, insert, delete on public.report_log to service_role;

create table if not exists public.quick_summary (
  user_id uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  text text not null check (char_length(text) between 1 and 300),
  updated_at timestamptz not null default now()
);
alter table public.quick_summary enable row level security;
revoke all on public.quick_summary from anon, authenticated;
grant select, insert, update, delete on public.quick_summary to authenticated;
grant select on public.quick_summary to service_role;
drop policy if exists "quick summary own" on public.quick_summary;
create policy "quick summary own" on public.quick_summary for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
