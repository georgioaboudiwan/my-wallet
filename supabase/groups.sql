drop function if exists public.create_loan_invite(uuid, text, text);
drop trigger if exists loan_invites_cleanup on public.loan_links;
drop function if exists public.loan_invites_cleanup();
drop table if exists public.loan_invites;

create table if not exists public.groups (
  id uuid primary key,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  enc text not null check (char_length(enc) between 20 and 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  sealed_key text check (sealed_key is null or char_length(sealed_key) between 40 and 1000),
  joined boolean not null default false,
  invited_by uuid references auth.users (id) on delete set null,
  profile text check (profile is null or char_length(profile) between 20 and 1000),
  pinged_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists group_members_user_idx on public.group_members (user_id);

create table if not exists public.group_entries (
  id text primary key check (id ~ '^ge-[A-Za-z0-9_-]{20,40}$'),
  group_id uuid not null references public.groups (id) on delete cascade,
  author uuid references auth.users (id) on delete set null,
  enc text not null check (char_length(enc) between 20 and 8000),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists group_entries_group_idx on public.group_entries (group_id, created_at desc);

create table if not exists public.group_votes (
  entry_id text not null references public.group_entries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  at timestamptz not null default now(),
  primary key (entry_id, user_id)
);

create table if not exists public.group_links (
  token text primary key check (token ~ '^[A-Za-z0-9_-]{32,64}$'),
  group_id uuid not null references public.groups (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.in_group(p_group uuid, p_joined boolean default true) returns boolean
language sql stable security definer set search_path = '' as $fn$
  select exists (select 1 from public.group_members m where m.group_id = p_group and m.user_id = (select auth.uid()) and (m.joined or not p_joined))
$fn$;
revoke all on function public.in_group(uuid, boolean) from public, anon;
grant execute on function public.in_group(uuid, boolean) to authenticated;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_entries enable row level security;
alter table public.group_votes enable row level security;
alter table public.group_links enable row level security;
revoke all on public.groups, public.group_members, public.group_entries, public.group_votes, public.group_links from anon, authenticated;
grant select on public.groups, public.group_members, public.group_entries, public.group_votes, public.group_links to authenticated;
grant insert (id, group_id, enc) on public.group_entries to authenticated;
grant delete on public.group_links to authenticated;

drop policy if exists "groups read" on public.groups;
drop policy if exists "group members read" on public.group_members;
drop policy if exists "group entries read" on public.group_entries;
drop policy if exists "group entries add" on public.group_entries;
drop policy if exists "group votes read" on public.group_votes;
drop policy if exists "group links read" on public.group_links;
drop policy if exists "group links remove" on public.group_links;
create policy "groups read" on public.groups for select to authenticated using (public.in_group(id, false));
create policy "group members read" on public.group_members for select to authenticated using (public.in_group(group_id, false));
create policy "group entries read" on public.group_entries for select to authenticated using (public.in_group(group_id, true));
create policy "group entries add" on public.group_entries for insert to authenticated with check (public.in_group(group_id, true));
create policy "group votes read" on public.group_votes for select to authenticated using (exists (select 1 from public.group_entries e where e.id = entry_id and public.in_group(e.group_id, true)));
create policy "group links read" on public.group_links for select to authenticated using (public.in_group(group_id, true));
create policy "group links remove" on public.group_links for delete to authenticated using (public.in_group(group_id, true));

create or replace function public.group_entries_guard() returns trigger
language plpgsql security definer set search_path = '' as $fn$
begin
  new.author := auth.uid();
  new.created_at := now();
  new.deleted_at := null;
  if (select count(*) from public.group_entries where author = new.author and created_at > now() - interval '1 hour') >= 120 then
    raise exception 'too many entries, try again later' using errcode = '54000';
  end if;
  update public.groups set updated_at = now() where id = new.group_id;
  return new;
end
$fn$;
revoke all on function public.group_entries_guard() from public, anon, authenticated;
drop trigger if exists group_entries_guard on public.group_entries;
create trigger group_entries_guard before insert on public.group_entries for each row execute function public.group_entries_guard();

create or replace function public.create_group(p_id uuid, p_enc text, p_sealed text) returns uuid
language plpgsql security definer set search_path = '' as $fn$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'sign in first' using errcode = '42501'; end if;
  if (select count(*) from public.groups where created_by = me and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'too many groups, try again later' using errcode = '54000';
  end if;
  insert into public.groups (id, created_by, enc) values (p_id, me, p_enc);
  insert into public.group_members (group_id, user_id, sealed_key, joined, invited_by) values (p_id, me, p_sealed, true, me);
  return p_id;
end
$fn$;

create or replace function public.update_group(p_group uuid, p_enc text) returns boolean
language plpgsql security definer set search_path = '' as $fn$
begin
  if not public.in_group(p_group, true) then raise exception 'not a member' using errcode = '42501'; end if;
  if p_enc is null or char_length(p_enc) not between 20 and 20000 then raise exception 'bad data' using errcode = '22023'; end if;
  update public.groups set enc = p_enc, updated_at = now() where id = p_group;
  return true;
end
$fn$;

create or replace function public.invite_to_group(p_group uuid, p_user uuid, p_sealed text) returns boolean
language plpgsql security definer set search_path = '' as $fn$
declare me uuid := auth.uid();
begin
  if not public.in_group(p_group, true) then raise exception 'not a member' using errcode = '42501'; end if;
  if p_user is null or p_user = me then raise exception 'bad user' using errcode = '22023'; end if;
  if p_sealed is null or char_length(p_sealed) not between 40 and 1000 then raise exception 'bad key' using errcode = '22023'; end if;
  if (select count(*) from public.group_members where group_id = p_group) >= 30 then raise exception 'group is full' using errcode = '54000'; end if;
  insert into public.group_members (group_id, user_id, sealed_key, joined, invited_by) values (p_group, p_user, p_sealed, false, me)
    on conflict (group_id, user_id) do update set sealed_key = excluded.sealed_key, invited_by = excluded.invited_by where not public.group_members.joined;
  return true;
end
$fn$;

create or replace function public.answer_group(p_group uuid, p_accept boolean) returns boolean
language plpgsql security definer set search_path = '' as $fn$
declare me uuid := auth.uid();
begin
  if not exists (select 1 from public.group_members where group_id = p_group and user_id = me) then raise exception 'no invite' using errcode = '42501'; end if;
  if p_accept then update public.group_members set joined = true where group_id = p_group and user_id = me;
  else delete from public.group_members where group_id = p_group and user_id = me and not joined; end if;
  return true;
end
$fn$;

create or replace function public.leave_group(p_group uuid) returns boolean
language plpgsql security definer set search_path = '' as $fn$
declare me uuid := auth.uid();
begin
  delete from public.group_members where group_id = p_group and user_id = me;
  if not exists (select 1 from public.group_members where group_id = p_group and joined) then delete from public.groups where id = p_group; end if;
  return true;
end
$fn$;

create or replace function public.make_group_link(p_group uuid, p_token text) returns boolean
language plpgsql security definer set search_path = '' as $fn$
begin
  if not public.in_group(p_group, true) then raise exception 'not a member' using errcode = '42501'; end if;
  if p_token !~ '^[A-Za-z0-9_-]{32,64}$' then raise exception 'bad token' using errcode = '22023'; end if;
  if (select count(*) from public.group_links where group_id = p_group) >= 10 then raise exception 'too many links' using errcode = '54000'; end if;
  insert into public.group_links (token, group_id, created_by) values (p_token, p_group, auth.uid());
  return true;
end
$fn$;

create or replace function public.join_group_link(p_token text, p_sealed text) returns uuid
language plpgsql security definer set search_path = '' as $fn$
declare
  me uuid := auth.uid();
  gid uuid;
begin
  if me is null then raise exception 'sign in first' using errcode = '42501'; end if;
  if p_token !~ '^[A-Za-z0-9_-]{32,64}$' then raise exception 'bad link' using errcode = '22023'; end if;
  if p_sealed is null or char_length(p_sealed) not between 40 and 1000 then raise exception 'bad key' using errcode = '22023'; end if;
  select group_id into gid from public.group_links where token = p_token;
  if gid is null then return null; end if;
  if (select count(*) from public.group_members where group_id = gid) >= 30 then raise exception 'group is full' using errcode = '54000'; end if;
  insert into public.group_members (group_id, user_id, sealed_key, joined, invited_by) values (gid, me, p_sealed, true, me)
    on conflict (group_id, user_id) do update set sealed_key = excluded.sealed_key, joined = true;
  return gid;
end
$fn$;

create or replace function public.vote_delete(p_entry text) returns jsonb
language plpgsql security definer set search_path = '' as $fn$
declare
  me uuid := auth.uid();
  gid uuid;
  need int;
  have int;
begin
  select group_id into gid from public.group_entries where id = p_entry and deleted_at is null;
  if gid is null or not public.in_group(gid, true) then raise exception 'not allowed' using errcode = '42501'; end if;
  insert into public.group_votes (entry_id, user_id) values (p_entry, me) on conflict do nothing;
  select count(*) into need from public.group_members where group_id = gid and joined;
  select count(*) into have from public.group_votes v join public.group_members m on m.user_id = v.user_id and m.group_id = gid and m.joined where v.entry_id = p_entry;
  if have >= need then
    update public.group_entries set deleted_at = now() where id = p_entry;
    update public.groups set updated_at = now() where id = gid;
  end if;
  return jsonb_build_object('deleted', have >= need, 'votes', have, 'need', need);
end
$fn$;

create or replace function public.unvote_delete(p_entry text) returns boolean
language plpgsql security definer set search_path = '' as $fn$
begin
  delete from public.group_votes where entry_id = p_entry and user_id = auth.uid();
  return true;
end
$fn$;

create or replace function public.set_group_profile(p_group uuid, p_profile text) returns boolean
language plpgsql security definer set search_path = '' as $fn$
begin
  if p_profile is null or char_length(p_profile) not between 20 and 1000 then raise exception 'bad data' using errcode = '22023'; end if;
  update public.group_members set profile = p_profile where group_id = p_group and user_id = auth.uid();
  return found;
end
$fn$;

do $$
declare f text;
begin
  foreach f in array array['create_group(uuid, text, text)', 'update_group(uuid, text)', 'invite_to_group(uuid, uuid, text)', 'answer_group(uuid, boolean)', 'leave_group(uuid)', 'make_group_link(uuid, text)', 'join_group_link(text, text)', 'vote_delete(text)', 'unvote_delete(text)', 'set_group_profile(uuid, text)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

create or replace function public.delete_group(p_group uuid) returns boolean
language plpgsql security definer set search_path = '' as $fn$
begin
  if not exists (select 1 from public.groups where id = p_group and created_by = auth.uid()) then
    raise exception 'only the creator can do this' using errcode = '42501';
  end if;
  if (select count(*) from public.group_members where group_id = p_group) > 2 then
    raise exception 'only for groups of two' using errcode = '22023';
  end if;
  delete from public.groups where id = p_group;
  return true;
end
$fn$;
revoke all on function public.delete_group(uuid) from public, anon;
grant execute on function public.delete_group(uuid) to authenticated;
