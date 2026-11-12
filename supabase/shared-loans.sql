create table if not exists public.loan_links (
  token text primary key check (token ~ '^[A-Za-z0-9_-]{32,64}$'),
  owner uuid not null references auth.users (id) on delete cascade,
  member uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  pinged_owner timestamptz,
  pinged_member timestamptz,
  check (owner <> member)
);
create index if not exists loan_links_owner_idx on public.loan_links (owner);
create index if not exists loan_links_member_idx on public.loan_links (member);
alter table public.loan_links enable row level security;
revoke all on public.loan_links from anon, authenticated;
grant select (token, owner, member, created_at), delete on public.loan_links to authenticated;
grant select, insert, update, delete on public.loan_links to service_role;
drop policy if exists "loan links read" on public.loan_links;
drop policy if exists "loan links leave" on public.loan_links;
create policy "loan links read" on public.loan_links for select to authenticated using (owner = (select auth.uid()) or member = (select auth.uid()));
create policy "loan links leave" on public.loan_links for delete to authenticated using (owner = (select auth.uid()) or member = (select auth.uid()));

create table if not exists public.shared_entries (
  id text primary key check (id ~ '^se-[A-Za-z0-9_-]{20,40}$'),
  token text not null references public.loan_links (token) on delete cascade,
  author uuid not null default auth.uid() references auth.users (id) on delete cascade,
  senc text not null check (char_length(senc) between 20 and 4000),
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);
create index if not exists shared_entries_token_idx on public.shared_entries (token, consumed_at);
alter table public.shared_entries enable row level security;
revoke all on public.shared_entries from anon, authenticated;
grant select, delete on public.shared_entries to authenticated;
grant insert (id, token, senc) on public.shared_entries to authenticated;
grant update (consumed_at) on public.shared_entries to authenticated;
drop policy if exists "shared entries read" on public.shared_entries;
drop policy if exists "shared entries add" on public.shared_entries;
drop policy if exists "shared entries consume" on public.shared_entries;
drop policy if exists "shared entries remove" on public.shared_entries;
create policy "shared entries read" on public.shared_entries for select to authenticated using (
  author = (select auth.uid()) or exists (select 1 from public.loan_links l where l.token = shared_entries.token and l.owner = (select auth.uid())));
create policy "shared entries add" on public.shared_entries for insert to authenticated with check (
  author = (select auth.uid()) and exists (select 1 from public.loan_links l where l.token = shared_entries.token and l.member = (select auth.uid())));
create policy "shared entries consume" on public.shared_entries for update to authenticated using (
  exists (select 1 from public.loan_links l where l.token = shared_entries.token and l.owner = (select auth.uid())))
  with check (exists (select 1 from public.loan_links l where l.token = shared_entries.token and l.owner = (select auth.uid())));
create policy "shared entries remove" on public.shared_entries for delete to authenticated using (
  (author = (select auth.uid()) and consumed_at is null) or exists (select 1 from public.loan_links l where l.token = shared_entries.token and l.owner = (select auth.uid())));

create or replace function public.shared_entries_guard() returns trigger
language plpgsql security definer set search_path = '' as $fn$
begin
  new.author := auth.uid();
  new.created_at := now();
  new.consumed_at := null;
  if (select count(*) from public.shared_entries where author = new.author and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'too many entries, try again later' using errcode = '54000';
  end if;
  return new;
end
$fn$;
revoke all on function public.shared_entries_guard() from public, anon, authenticated;
drop trigger if exists shared_entries_guard on public.shared_entries;
create trigger shared_entries_guard before insert on public.shared_entries for each row execute function public.shared_entries_guard();

create or replace function public.join_loan(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $fn$
declare
  me uuid := auth.uid();
  owner_id uuid;
  current_member uuid;
begin
  if me is null then raise exception 'sign in first' using errcode = '42501'; end if;
  if p_token !~ '^[A-Za-z0-9_-]{32,64}$' then raise exception 'bad link' using errcode = '22023'; end if;
  select p.user_id into owner_id from public.people p where p.share_token = p_token and p.deleted_at is null limit 1;
  if owner_id is null then return jsonb_build_object('ok', false, 'reason', 'gone'); end if;
  if owner_id = me then return jsonb_build_object('ok', false, 'reason', 'own'); end if;
  select member into current_member from public.loan_links where token = p_token;
  if current_member is not null and current_member <> me then return jsonb_build_object('ok', false, 'reason', 'taken'); end if;
  insert into public.loan_links (token, owner, member) values (p_token, owner_id, me) on conflict (token) do nothing;
  return jsonb_build_object('ok', true);
end
$fn$;
revoke all on function public.join_loan(text) from public, anon;
grant execute on function public.join_loan(text) to authenticated;

create or replace function public.people_unlink() returns trigger
language plpgsql security definer set search_path = '' as $fn$
begin
  if old.share_token is not null and (new.share_token is distinct from old.share_token or new.deleted_at is not null) then
    delete from public.loan_links where token = old.share_token and owner = old.user_id;
  end if;
  return new;
end
$fn$;
revoke all on function public.people_unlink() from public, anon, authenticated;
drop trigger if exists people_unlink on public.people;
create trigger people_unlink after update on public.people for each row execute function public.people_unlink();

create or replace function public.people_unlink_delete() returns trigger
language plpgsql security definer set search_path = '' as $fn$
begin
  if old.share_token is not null then delete from public.loan_links where token = old.share_token and owner = old.user_id; end if;
  return old;
end
$fn$;
revoke all on function public.people_unlink_delete() from public, anon, authenticated;
drop trigger if exists people_unlink_delete on public.people;
create trigger people_unlink_delete after delete on public.people for each row execute function public.people_unlink_delete();
