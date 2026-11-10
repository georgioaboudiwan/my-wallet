create table if not exists public.quick_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);
create table if not exists public.quick_inbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null check (amount > 0 and amount < 1000000000000000),
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now()
);
alter table public.quick_tokens enable row level security;
alter table public.quick_inbox enable row level security;
revoke all on public.quick_tokens, public.quick_inbox from anon, authenticated;
grant select, insert, update, delete on public.quick_tokens to authenticated;
grant select, delete on public.quick_inbox to authenticated;
grant select on public.quick_tokens to service_role;
grant select, insert on public.quick_inbox to service_role;
drop policy if exists "quick tokens own" on public.quick_tokens;
create policy "quick tokens own" on public.quick_tokens for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "quick inbox read own" on public.quick_inbox;
drop policy if exists "quick inbox delete own" on public.quick_inbox;
create policy "quick inbox read own" on public.quick_inbox for select to authenticated using ((select auth.uid()) = user_id);
create policy "quick inbox delete own" on public.quick_inbox for delete to authenticated using ((select auth.uid()) = user_id);
create index if not exists quick_inbox_user_idx on public.quick_inbox (user_id);
