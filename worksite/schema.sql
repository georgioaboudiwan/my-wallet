create extension if not exists pgcrypto;

create table if not exists public.ws_business (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 120),
  lbp_rate numeric(12,0) not null default 89500 check (lbp_rate > 0),
  hours_per_day numeric(4,2) not null default 8 check (hours_per_day > 0 and hours_per_day <= 24),
  period text not null default 'week' check (period in ('day','week','month')),
  week_start smallint not null default 1 check (week_start between 0 and 6),
  lang text not null default 'en' check (lang in ('en','ar')),
  created_at timestamptz not null default now()
);

create table if not exists public.ws_sites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  location text check (char_length(location) <= 200),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table if not exists public.ws_workers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  phone text check (char_length(phone) <= 40),
  trade text check (char_length(trade) <= 60),
  daily_rate numeric(12,2) not null default 0 check (daily_rate >= 0),
  active boolean not null default true,
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table if not exists public.ws_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  worker_id uuid not null,
  site_id uuid,
  day date not null,
  status text not null default 'planned' check (status in ('planned','worked','absent')),
  days numeric(5,3) not null default 0 check (days >= 0 and days <= 2),
  hours numeric(5,2) check (hours >= 0 and hours <= 24),
  rate numeric(12,2) not null default 0 check (rate >= 0),
  amount numeric(14,2) generated always as (case when status = 'worked' then round(days * rate, 2) else 0 end) stored,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  unique (worker_id, day),
  foreign key (worker_id, owner_id) references public.ws_workers(id, owner_id) on delete cascade,
  foreign key (site_id, owner_id) references public.ws_sites(id, owner_id) on delete set null (site_id)
);

create table if not exists public.ws_payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  worker_id uuid not null,
  paid_on date not null default current_date,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'USD' check (currency in ('USD','LBP')),
  lbp_amount numeric(16,0) check (lbp_amount > 0),
  lbp_rate numeric(12,0) check (lbp_rate > 0),
  method text not null default 'cash' check (method in ('cash','transfer','whish','omt','other')),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  check (currency = 'USD' or (lbp_amount is not null and lbp_rate is not null)),
  foreign key (worker_id, owner_id) references public.ws_workers(id, owner_id) on delete cascade
);

create index if not exists ws_entries_owner_day on public.ws_entries (owner_id, day);
create index if not exists ws_entries_site on public.ws_entries (site_id);
create index if not exists ws_payments_owner_day on public.ws_payments (owner_id, paid_on);
create index if not exists ws_payments_worker on public.ws_payments (worker_id);
create index if not exists ws_workers_owner on public.ws_workers (owner_id);
create index if not exists ws_sites_owner on public.ws_sites (owner_id);

alter table public.ws_business enable row level security;
alter table public.ws_sites enable row level security;
alter table public.ws_workers enable row level security;
alter table public.ws_entries enable row level security;
alter table public.ws_payments enable row level security;

do $$
declare t text;
begin
  foreach t in array array['ws_business','ws_sites','ws_workers','ws_entries','ws_payments'] loop
    execute format('drop policy if exists %I_owner on public.%I', t, t);
    execute format(
      'create policy %I_owner on public.%I for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))',
      t, t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;
