create or replace function public.wallet_touch() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  if tg_op = 'UPDATE' then
    new.user_id = old.user_id;
    new.created_at = old.created_at;
  end if;
  return new;
end;
$$;

create table if not exists public.accounts (
  id text primary key check (char_length(id) between 1 and 120),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  currency text not null check (currency in ('USD', 'LBP')),
  kind text not null check (kind in ('cash', 'bank', 'card', 'savings')),
  opening_balance numeric(20, 2) not null default 0 check (abs(opening_balance) < 1e15),
  sort integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.categories (
  id text primary key check (char_length(id) between 1 and 120),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  kind text not null check (kind in ('expense', 'income')),
  bucket text check (bucket in ('needs', 'wants', 'savings')),
  color text not null default '#5b7083' check (color ~ '^#[0-9a-fA-F]{6}$'),
  budget numeric(14, 2) check (budget is null or (budget >= 0 and budget < 1e10)),
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.transactions (
  id text primary key check (char_length(id) between 1 and 160),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('expense', 'income', 'transfer')),
  amount numeric(20, 2) not null check (amount > 0 and amount < 1e15),
  currency text not null check (currency in ('USD', 'LBP')),
  rate numeric(14, 2) not null check (rate > 0 and rate < 1e9),
  account_id text not null check (char_length(account_id) <= 120),
  to_account_id text check (char_length(to_account_id) <= 120),
  to_amount numeric(20, 2) check (to_amount is null or (to_amount > 0 and to_amount < 1e15)),
  category_id text check (char_length(category_id) <= 120),
  note text check (char_length(note) <= 200),
  occurred_on date not null,
  rule_id text check (char_length(rule_id) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (kind <> 'transfer' or (to_account_id is not null and to_amount is not null))
);

create table if not exists public.rules (
  id text primary key check (char_length(id) between 1 and 120),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('expense', 'income')),
  amount numeric(20, 2) not null check (amount > 0 and amount < 1e15),
  currency text not null check (currency in ('USD', 'LBP')),
  account_id text not null check (char_length(account_id) <= 120),
  category_id text check (char_length(category_id) <= 120),
  note text check (char_length(note) <= 200),
  day integer not null check (day between 1 and 28),
  next_on date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.settings (
  id text primary key check (char_length(id) between 1 and 120),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

do $$
declare t text;
begin
  foreach t in array array['accounts', 'categories', 'transactions', 'rules', 'settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update on public.%I to authenticated', t);
    execute format('revoke delete, truncate, references, trigger on public.%I from authenticated', t);
    execute format('drop policy if exists own_select on public.%I', t);
    execute format('drop policy if exists own_insert on public.%I', t);
    execute format('drop policy if exists own_update on public.%I', t);
    execute format('create policy own_select on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy own_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy own_update on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('drop trigger if exists touch on public.%I', t);
    execute format('create trigger touch before insert or update on public.%I for each row execute function public.wallet_touch()', t);
    execute format('create index if not exists %I on public.%I (user_id, updated_at)', t || '_sync_idx', t);
  end loop;
end;
$$;

alter table public.transactions add column if not exists receipt text check (receipt is null or receipt ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$');
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('receipts', 'receipts', false, 2097152, array['image/jpeg']) on conflict (id) do nothing;
create policy "receipts select own" on storage.objects for select to authenticated using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "receipts insert own" on storage.objects for insert to authenticated with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "receipts delete own" on storage.objects for delete to authenticated using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);
