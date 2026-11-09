create table if not exists public.people (
  id text primary key check (char_length(id) between 1 and 120),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  direction text not null check (direction in ('owes_me', 'i_owe')),
  currency text not null default 'USD' check (currency in ('USD', 'LBP')),
  phone text check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  share_token text unique check (share_token ~ '^[A-Za-z0-9_-]{32,64}$'),
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.loan_entries (
  id text primary key check (char_length(id) between 1 and 120),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  person_id text not null check (char_length(person_id) <= 120),
  amount numeric(20, 2) not null check (amount <> 0 and abs(amount) < 1e15),
  note text check (char_length(note) <= 200),
  occurred_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

do $$
declare t text;
begin
  foreach t in array array['people', 'loan_entries'] loop
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

create index if not exists loan_entries_person_idx on public.loan_entries (person_id, occurred_on desc);

create or replace function public.shared_ledger(p_token text) returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'name', p.name,
    'direction', p.direction,
    'currency', p.currency,
    'from', (select s.data ->> 'name' from public.settings s where s.user_id = p.user_id and s.id = 'settings:' || p.user_id::text and s.deleted_at is null),
    'balance', coalesce((select sum(e.amount) from public.loan_entries e where e.person_id = p.id and e.user_id = p.user_id and e.deleted_at is null), 0),
    'history', coalesce((
      select jsonb_agg(jsonb_build_object('amount', x.amount, 'note', x.note, 'date', x.occurred_on) order by x.occurred_on desc, x.created_at desc)
      from (
        select e.amount, e.note, e.occurred_on, e.created_at
        from public.loan_entries e
        where e.person_id = p.id and e.user_id = p.user_id and e.deleted_at is null
        order by e.occurred_on desc, e.created_at desc
        limit 200
      ) x
    ), '[]'::jsonb)
  )
  from public.people p
  where p_token ~ '^[A-Za-z0-9_-]{32,64}$'
    and p.share_token = p_token
    and p.deleted_at is null
$$;

revoke all on function public.shared_ledger(text) from public;
grant execute on function public.shared_ledger(text) to anon, authenticated;
