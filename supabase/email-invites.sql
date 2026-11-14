create table if not exists public.group_email_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  email text not null check (char_length(email) between 3 and 254 and email = lower(email)),
  guest_id text check (guest_id is null or guest_id ~ '^[A-Za-z0-9_-]{6,40}$'),
  invited_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  emailed_at timestamptz,
  unique (group_id, email)
);
create index if not exists group_email_invites_email_idx on public.group_email_invites (email);
alter table public.group_email_invites enable row level security;
revoke all on public.group_email_invites from anon, authenticated;
grant select, delete on public.group_email_invites to authenticated;
drop policy if exists "email invites read" on public.group_email_invites;
drop policy if exists "email invites remove" on public.group_email_invites;
create policy "email invites read" on public.group_email_invites for select to authenticated using (public.in_group(group_id, true));
create policy "email invites remove" on public.group_email_invites for delete to authenticated using (public.in_group(group_id, true));

create or replace function public.invite_email(p_group uuid, p_email text, p_guest text default null) returns jsonb
language plpgsql security definer set search_path = '' as $fn$
declare
  me uuid := auth.uid();
  addr text := lower(trim(coalesce(p_email, '')));
  target uuid;
  key text;
begin
  if not public.in_group(p_group, true) then raise exception 'not a member' using errcode = '42501'; end if;
  if char_length(addr) > 254 or addr !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'bad email' using errcode = '22023'; end if;
  if p_guest is not null and p_guest !~ '^[A-Za-z0-9_-]{6,40}$' then raise exception 'bad guest' using errcode = '22023'; end if;
  if (select count(*) from public.group_email_invites where invited_by = me and created_at > now() - interval '1 day') >= 30 then
    raise exception 'too many invites today' using errcode = '54000';
  end if;
  select u.id into target from auth.users u where lower(u.email) = addr and u.deleted_at is null limit 1;
  if target = me then return jsonb_build_object('self', true); end if;
  if target is not null and exists (select 1 from public.group_members where group_id = p_group and user_id = target and joined) then
    return jsonb_build_object('member', true);
  end if;
  insert into public.group_email_invites (group_id, email, guest_id, invited_by) values (p_group, addr, p_guest, me)
    on conflict (group_id, email) do update set guest_id = coalesce(excluded.guest_id, public.group_email_invites.guest_id), invited_by = excluded.invited_by, created_at = now(), emailed_at = null;
  if target is not null then select k.pub into key from public.user_keys k where k.user_id = target; end if;
  return jsonb_build_object('user_id', case when key is not null then target end, 'pub', key);
end
$fn$;
revoke all on function public.invite_email(uuid, text, text) from public, anon;
grant execute on function public.invite_email(uuid, text, text) to authenticated;

create or replace function public.resolve_email_invites(p_group uuid) returns table (id uuid, email text, guest_id text, user_id uuid, pub text)
language sql stable security definer set search_path = '' as $fn$
  select i.id, i.email, i.guest_id, u.id, k.pub
  from public.group_email_invites i
  join auth.users u on lower(u.email) = i.email and u.deleted_at is null
  join public.user_keys k on k.user_id = u.id
  where i.group_id = p_group and public.in_group(p_group, true)
    and not exists (select 1 from public.group_members m where m.group_id = i.group_id and m.user_id = u.id and m.sealed_key is not null)
$fn$;
revoke all on function public.resolve_email_invites(uuid) from public, anon;
grant execute on function public.resolve_email_invites(uuid) to authenticated;

select cron.unschedule('wallet-email-invites-cleanup') where exists (select 1 from cron.job where jobname = 'wallet-email-invites-cleanup');
select cron.schedule('wallet-email-invites-cleanup', '29 3 * * *', $job$ delete from public.group_email_invites where created_at < now() - interval '60 days' $job$);
grant select, insert, update, delete on public.groups, public.group_members, public.group_entries, public.group_votes, public.group_links, public.group_email_invites, public.user_keys, public.shared_entries, public.loan_links to service_role;

create or replace function public.my_invite_emails(p_group uuid) returns table (user_id uuid, email text)
language sql stable security definer set search_path = '' as $fn$
  select m.user_id, lower(u.email)::text
  from public.group_members m
  join auth.users u on u.id = m.user_id
  where m.group_id = p_group and m.invited_by = auth.uid() and m.user_id <> auth.uid()
    and public.in_group(p_group, true)
$fn$;
revoke all on function public.my_invite_emails(uuid) from public, anon;
grant execute on function public.my_invite_emails(uuid) to authenticated;
