create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;
grant select on public.admins to service_role;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $fn$
  select exists (select 1 from public.admins where user_id = (select auth.uid()))
$fn$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
