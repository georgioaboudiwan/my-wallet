create table if not exists public.price_cache (
  key text primary key check (key ~ '^[a-z]{2,6}:[A-Za-z0-9.^=_-]{1,40}$'),
  usd double precision not null check (usd >= 0),
  chg double precision,
  at timestamptz not null default now()
);
alter table public.price_cache enable row level security;
revoke all on public.price_cache from anon, authenticated;
