create table if not exists public.push_subs (
 id text primary key check (char_length(id) between 8 and 120),
 user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
 endpoint text not null unique check (endpoint ~ '^https://' and char_length(endpoint) < 1000),
 p256dh text not null check (char_length(p256dh) < 200),
 auth text not null check (char_length(auth) < 100),
 remind_at time not null default '21:00',
 tz text not null default 'Asia/Beirut' check (char_length(tz) < 64),
 enabled boolean not null default true,
 last_sent date,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now());

alter table public.push_subs enable row level security;
alter table public.push_subs force row level security;
revoke all on public.push_subs from anon;
grant select, insert, update, delete on public.push_subs to authenticated;
create policy push_select on public.push_subs for select to authenticated using ((select auth.uid()) = user_id);
create policy push_insert on public.push_subs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy push_update on public.push_subs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy push_delete on public.push_subs for delete to authenticated using ((select auth.uid()) = user_id);
create trigger touch before insert or update on public.push_subs for each row execute function public.wallet_touch();

create table if not exists public.push_keys (
 id integer primary key check (id = 1),
 public_key text,
 private_jwk jsonb,
 cron_secret text not null);
alter table public.push_keys enable row level security;
revoke all on public.push_keys from anon, authenticated;
insert into public.push_keys (id, cron_secret)
values (1, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (id) do nothing;

create or replace function public.push_public_key() returns text
language sql stable security definer set search_path = '' as $fn$
 select public_key from public.push_keys where id = 1
$fn$;
revoke all on function public.push_public_key() from public;
grant execute on function public.push_public_key() to authenticated;

grant select, update on public.push_keys to service_role;
grant select, update, delete on public.push_subs to service_role;
grant select on public.transactions to service_role;
create index if not exists push_subs_user_id_idx on public.push_subs (user_id);
grant select on public.rules, public.categories to service_role;
