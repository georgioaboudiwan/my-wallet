create table if not exists public.sync_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('data', 'group', 'loan', 'inbox')),
  at timestamptz not null default now()
);
create index if not exists sync_events_user_idx on public.sync_events (user_id, at desc);
alter table public.sync_events enable row level security;
alter table public.sync_events replica identity default;
revoke all on public.sync_events from anon, authenticated;
grant select on public.sync_events to authenticated;
grant select, insert, delete on public.sync_events to service_role;
drop policy if exists "sync events own" on public.sync_events;
create policy "sync events own" on public.sync_events for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.live_own() returns trigger
language plpgsql security definer set search_path = '' as $fn$
begin
  insert into public.sync_events (user_id, kind) values (coalesce(new.user_id, old.user_id), 'data');
  return null;
end
$fn$;

create or replace function public.live_group() returns trigger
language plpgsql security definer set search_path = '' as $fn$
declare gid uuid;
begin
  if tg_table_name = 'groups' then gid := coalesce(new.id, old.id);
  elsif tg_table_name = 'group_votes' then select e.group_id into gid from public.group_entries e where e.id = coalesce(new.entry_id, old.entry_id);
  else gid := coalesce(new.group_id, old.group_id);
  end if;
  if gid is null then return null; end if;
  insert into public.sync_events (user_id, kind) select m.user_id, 'group' from public.group_members m where m.group_id = gid;
  if tg_table_name = 'group_members' and tg_op = 'DELETE' then
    insert into public.sync_events (user_id, kind) values (old.user_id, 'group');
  end if;
  return null;
end
$fn$;

create or replace function public.live_loan() returns trigger
language plpgsql security definer set search_path = '' as $fn$
declare t text := coalesce(new.token, old.token);
begin
  insert into public.sync_events (user_id, kind)
    select u, 'loan' from public.loan_links l, lateral (values (l.owner), (l.member)) v(u) where l.token = t;
  if tg_table_name = 'loan_links' and tg_op = 'DELETE' then
    insert into public.sync_events (user_id, kind) values (old.owner, 'loan'), (old.member, 'loan');
  end if;
  return null;
end
$fn$;

create or replace function public.live_people_ledger() returns trigger
language plpgsql security definer set search_path = '' as $fn$
declare
  pid text := coalesce(new.person_id, old.person_id);
  tok text;
begin
  select p.share_token into tok from public.people p where p.id = pid;
  if tok is not null then
    insert into public.sync_events (user_id, kind) select l.member, 'loan' from public.loan_links l where l.token = tok;
  end if;
  return null;
end
$fn$;

create or replace function public.live_inbox() returns trigger
language plpgsql security definer set search_path = '' as $fn$
begin
  if new.target_user is not null then insert into public.sync_events (user_id, kind) values (new.target_user, 'inbox'); end if;
  return null;
end
$fn$;

do $$
declare t text;
begin
  foreach t in array array['accounts', 'categories', 'transactions', 'rules', 'settings', 'people', 'loan_entries'] loop
    execute format('drop trigger if exists live_own on public.%I', t);
    execute format('create trigger live_own after insert or update on public.%I for each row execute function public.live_own()', t);
  end loop;
  foreach t in array array['groups', 'group_members', 'group_entries', 'group_votes'] loop
    execute format('drop trigger if exists live_group on public.%I', t);
    execute format('create trigger live_group after insert or update or delete on public.%I for each row execute function public.live_group()', t);
  end loop;
  foreach t in array array['shared_entries', 'loan_links'] loop
    execute format('drop trigger if exists live_loan on public.%I', t);
    execute format('create trigger live_loan after insert or update or delete on public.%I for each row execute function public.live_loan()', t);
  end loop;
end $$;
drop trigger if exists live_people_ledger on public.loan_entries;
create trigger live_people_ledger after insert or update on public.loan_entries for each row execute function public.live_people_ledger();
drop trigger if exists live_inbox on public.notifications;
create trigger live_inbox after insert on public.notifications for each row execute function public.live_inbox();

revoke all on function public.live_own(), public.live_group(), public.live_loan(), public.live_people_ledger(), public.live_inbox() from public, anon, authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'sync_events') then
    alter publication supabase_realtime add table public.sync_events;
  end if;
end $$;

select cron.unschedule('wallet-sync-events-cleanup') where exists (select 1 from cron.job where jobname = 'wallet-sync-events-cleanup');
select cron.schedule('wallet-sync-events-cleanup', '*/30 * * * *', $job$ delete from public.sync_events where at < now() - interval '1 hour' $job$);
