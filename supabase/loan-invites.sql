create table if not exists public.user_keys (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  pub text not null check (pub ~ '^[A-Za-z0-9_-]{80,100}$'),
  updated_at timestamptz not null default now()
);
alter table public.user_keys enable row level security;
revoke all on public.user_keys from anon, authenticated;
grant select, insert, update on public.user_keys to authenticated;
drop policy if exists "user keys own" on public.user_keys;
create policy "user keys own" on public.user_keys for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table if not exists public.lookup_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  at timestamptz not null default now()
);
create index if not exists lookup_log_user_idx on public.lookup_log (user_id, at desc);
alter table public.lookup_log enable row level security;
revoke all on public.lookup_log from anon, authenticated;

create or replace function public.find_wallet_user(p_email text) returns jsonb
language plpgsql security definer set search_path = '' as $fn$
declare
  me uuid := auth.uid();
  target uuid;
  key text;
begin
  if me is null then raise exception 'sign in first' using errcode = '42501'; end if;
  if p_email is null or char_length(p_email) > 254 or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('found', false); end if;
  if (select count(*) from public.lookup_log where user_id = me and at > now() - interval '1 hour') >= 20 then
    raise exception 'too many lookups, try again later' using errcode = '54000';
  end if;
  insert into public.lookup_log (user_id) values (me);
  select u.id into target from auth.users u where lower(u.email) = lower(trim(p_email)) and u.deleted_at is null limit 1;
  if target is null or target = me then return jsonb_build_object('found', false, 'self', target = me); end if;
  select k.pub into key from public.user_keys k where k.user_id = target;
  if key is null then return jsonb_build_object('found', false); end if;
  return jsonb_build_object('found', true, 'id', target, 'pub', key);
end
$fn$;
revoke all on function public.find_wallet_user(text) from public, anon;
grant execute on function public.find_wallet_user(text) to authenticated;

create table if not exists public.loan_invites (
  id uuid primary key default gen_random_uuid(),
  token text not null check (token ~ '^[A-Za-z0-9_-]{32,64}$'),
  owner uuid not null references auth.users (id) on delete cascade,
  invitee uuid not null references auth.users (id) on delete cascade,
  sealed text not null check (char_length(sealed) between 40 and 2000),
  created_at timestamptz not null default now(),
  unique (token, invitee),
  check (owner <> invitee)
);
create index if not exists loan_invites_invitee_idx on public.loan_invites (invitee);
alter table public.loan_invites enable row level security;
revoke all on public.loan_invites from anon, authenticated;
grant select, delete on public.loan_invites to authenticated;
drop policy if exists "loan invites read" on public.loan_invites;
drop policy if exists "loan invites remove" on public.loan_invites;
create policy "loan invites read" on public.loan_invites for select to authenticated using (owner = (select auth.uid()) or invitee = (select auth.uid()));
create policy "loan invites remove" on public.loan_invites for delete to authenticated using (owner = (select auth.uid()) or invitee = (select auth.uid()));

create or replace function public.create_loan_invite(p_invitee uuid, p_token text, p_sealed text) returns uuid
language plpgsql security definer set search_path = '' as $fn$
declare
  me uuid := auth.uid();
  new_id uuid;
begin
  if me is null then raise exception 'sign in first' using errcode = '42501'; end if;
  if p_invitee is null or p_invitee = me then raise exception 'bad invitee' using errcode = '22023'; end if;
  if p_sealed is null or char_length(p_sealed) not between 40 and 2000 then raise exception 'bad invite' using errcode = '22023'; end if;
  if not exists (select 1 from public.people p where p.share_token = p_token and p.user_id = me and p.deleted_at is null) then
    raise exception 'not your loan' using errcode = '42501';
  end if;
  if exists (select 1 from public.loan_links l where l.token = p_token) then raise exception 'already connected' using errcode = '23505'; end if;
  if (select count(*) from public.loan_invites where owner = me and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'too many invites, try again later' using errcode = '54000';
  end if;
  delete from public.loan_invites where token = p_token and owner = me;
  insert into public.loan_invites (token, owner, invitee, sealed) values (p_token, me, p_invitee, p_sealed) returning id into new_id;
  return new_id;
end
$fn$;
revoke all on function public.create_loan_invite(uuid, text, text) from public, anon;
grant execute on function public.create_loan_invite(uuid, text, text) to authenticated;

create or replace function public.loan_invites_cleanup() returns trigger
language plpgsql security definer set search_path = '' as $fn$
begin
  delete from public.loan_invites where token = new.token;
  return new;
end
$fn$;
revoke all on function public.loan_invites_cleanup() from public, anon, authenticated;
drop trigger if exists loan_invites_cleanup on public.loan_links;
create trigger loan_invites_cleanup after insert on public.loan_links for each row execute function public.loan_invites_cleanup();

select cron.unschedule('wallet-lookup-cleanup') where exists (select 1 from cron.job where jobname = 'wallet-lookup-cleanup');
select cron.schedule('wallet-lookup-cleanup', '23 3 * * *', $job$ delete from public.lookup_log where at < now() - interval '2 days'; delete from public.loan_invites where created_at < now() - interval '30 days' $job$);
