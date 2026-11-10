alter table public.accounts add column if not exists enc text check (enc is null or char_length(enc) < 8000);
alter table public.categories add column if not exists enc text check (enc is null or char_length(enc) < 8000);
alter table public.transactions add column if not exists enc text check (enc is null or char_length(enc) < 8000);
alter table public.rules add column if not exists enc text check (enc is null or char_length(enc) < 8000);
alter table public.settings add column if not exists enc text check (enc is null or char_length(enc) < 60000);
alter table public.people add column if not exists enc text check (enc is null or char_length(enc) < 8000);
alter table public.loan_entries add column if not exists enc text check (enc is null or char_length(enc) < 8000);
alter table public.people add column if not exists senc text check (senc is null or char_length(senc) < 4000);
alter table public.loan_entries add column if not exists senc text check (senc is null or char_length(senc) < 4000);

create table if not exists public.vault (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  salt text not null check (char_length(salt) between 16 and 64),
  wrapped_pw text not null check (char_length(wrapped_pw) < 400),
  wrapped_rc text not null check (char_length(wrapped_rc) < 400),
  updated_at timestamptz not null default now()
);
alter table public.vault enable row level security;
revoke all on public.vault from anon, authenticated;
grant select, insert, update on public.vault to authenticated;
drop policy if exists "vault select own" on public.vault;
drop policy if exists "vault insert own" on public.vault;
drop policy if exists "vault update own" on public.vault;
create policy "vault select own" on public.vault for select to authenticated using ((select auth.uid()) = user_id);
create policy "vault insert own" on public.vault for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "vault update own" on public.vault for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop function if exists public.shared_ledger(text);
revoke select on public.categories from service_role;
create function public.shared_ledger(p_token text)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'v', 2,
    'person', p.senc,
    'history', coalesce((
      select json_agg(e.senc order by e.occurred_on desc, e.created_at desc)
      from public.loan_entries e
      where e.person_id = p.id and e.user_id = p.user_id and e.deleted_at is null and e.senc is not null
    ), '[]'::json)
  )
  from public.people p
  where p_token ~ '^[A-Za-z0-9_-]{32,64}$' and p.share_token = p_token and p.deleted_at is null and p.senc is not null
  limit 1;
$$;
revoke all on function public.shared_ledger(text) from public;
grant execute on function public.shared_ledger(text) to anon, authenticated;
alter table public.vault add column if not exists escrow text check (escrow is null or char_length(escrow) < 400);
grant select, update on public.vault to service_role;
