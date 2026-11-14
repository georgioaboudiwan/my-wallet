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

create table if not exists public.release_log (
  version text primary key check (version ~ '^\d{1,3}\.\d{1,3}\.\d{1,3}$'),
  sent_at timestamptz not null default now()
);
alter table public.release_log enable row level security;
revoke all on public.release_log from anon, authenticated;
grant select, insert, delete on public.release_log to service_role;

alter table public.quick_inbox add column if not exists account text check (account is null or char_length(account) <= 60);
create table if not exists public.quick_lists (
  user_id uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  cats jsonb not null default '[]'::jsonb check (jsonb_typeof(cats) = 'array' and jsonb_array_length(cats) <= 60 and pg_column_size(cats) < 8000),
  accounts jsonb not null default '[]'::jsonb check (jsonb_typeof(accounts) = 'array' and jsonb_array_length(accounts) <= 30 and pg_column_size(accounts) < 4000),
  updated_at timestamptz not null default now()
);
alter table public.quick_lists enable row level security;
revoke all on public.quick_lists from anon, authenticated;
grant select, insert, update, delete on public.quick_lists to authenticated;
grant select on public.quick_lists to service_role;
drop policy if exists "quick lists own" on public.quick_lists;
create policy "quick lists own" on public.quick_lists for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
