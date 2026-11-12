create table if not exists public.app_events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  event text not null check (event ~ '^[a-z_]{2,24}$'),
  detail text check (detail is null or detail ~ '^[a-z0-9_:.-]{1,40}$'),
  device text check (device is null or device in ('iphone', 'ipad', 'android', 'mac', 'windows', 'linux', 'other')),
  standalone boolean,
  version text check (version is null or version ~ '^[0-9.]{1,12}$')
);
create index if not exists app_events_time_idx on public.app_events (created_at desc);
create index if not exists app_events_user_idx on public.app_events (user_id, created_at desc);
alter table public.app_events enable row level security;
revoke all on public.app_events from anon, authenticated;
grant insert (event, detail, device, standalone, version) on public.app_events to authenticated;
grant select, delete on public.app_events to service_role;
drop policy if exists "app events insert own" on public.app_events;
create policy "app events insert own" on public.app_events for insert to authenticated with check (user_id = (select auth.uid()));

create or replace function public.app_events_limit() returns trigger
language plpgsql security definer set search_path = '' as $fn$
begin
  new.user_id := auth.uid();
  new.created_at := now();
  if (select count(*) from public.app_events where user_id = new.user_id and created_at > now() - interval '1 minute') >= 120 then
    return null;
  end if;
  return new;
end
$fn$;
revoke all on function public.app_events_limit() from public, anon, authenticated;
drop trigger if exists app_events_limit on public.app_events;
create trigger app_events_limit before insert on public.app_events for each row execute function public.app_events_limit();

alter table public.admins add column if not exists alert_opens boolean not null default false;

create table if not exists public.open_alerts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  at timestamptz not null
);
alter table public.open_alerts enable row level security;
revoke all on public.open_alerts from anon, authenticated;

create or replace function public.app_events_alert() returns trigger
language plpgsql security definer set search_path = '' as $fn$
declare
  secret text;
begin
  if new.event <> 'open' then return null; end if;
  if exists (select 1 from public.admins where user_id = new.user_id) then return null; end if;
  if not exists (select 1 from public.admins where alert_opens) then return null; end if;
  insert into public.open_alerts as o (user_id, at) values (new.user_id, now())
    on conflict (user_id) do update set at = excluded.at where o.at < now() - interval '30 minutes';
  if not found then return null; end if;
  select cron_secret into secret from public.push_keys where id = 1;
  perform net.http_post(
    url := 'https://kjzxixqjuhpjuytwtvfv.supabase.co/functions/v1/send-reminder',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', secret),
    body := jsonb_build_object('action', 'open_alert', 'user_id', new.user_id, 'device', new.device),
    timeout_milliseconds := 15000);
  return null;
end
$fn$;
revoke all on function public.app_events_alert() from public, anon, authenticated;
drop trigger if exists app_events_alert on public.app_events;
create trigger app_events_alert after insert on public.app_events for each row execute function public.app_events_alert();

create or replace function public.admin_usage(p_days integer default 30, p_tz text default 'UTC') returns jsonb
language plpgsql stable security definer set search_path = '' as $fn$
declare
  since timestamptz;
  tz text := coalesce((select name from pg_catalog.pg_timezone_names where name = p_tz), 'UTC');
  result jsonb;
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  since := now() - make_interval(days => least(greatest(coalesce(p_days, 30), 1), 180));
  select jsonb_build_object(
    'tz', tz,
    'active', jsonb_build_object(
      'today', (select count(distinct user_id) from public.app_events where created_at >= date_trunc('day', now() at time zone tz) at time zone tz),
      'week', (select count(distinct user_id) from public.app_events where created_at > now() - interval '7 days'),
      'month', (select count(distinct user_id) from public.app_events where created_at > now() - interval '30 days')),
    'opens_today', (select count(*) from public.app_events where event = 'open' and created_at >= date_trunc('day', now() at time zone tz) at time zone tz),
    'days', coalesce((select jsonb_agg(d order by d->>'day') from (
      select jsonb_build_object('day', to_char(created_at at time zone tz, 'YYYY-MM-DD'), 'opens', count(*), 'users', count(distinct user_id)) d
      from public.app_events where event = 'open' and created_at > since group by to_char(created_at at time zone tz, 'YYYY-MM-DD')) x), '[]'::jsonb),
    'top', coalesce((select jsonb_agg(t order by (t->>'n')::int desc) from (
      select jsonb_build_object('event', event, 'detail', detail, 'n', count(*), 'users', count(distinct user_id)) t
      from public.app_events where created_at > since and event <> 'open' group by event, detail order by count(*) desc limit 25) y), '[]'::jsonb),
    'devices', coalesce((select jsonb_object_agg(coalesce(device, 'other'), n) from (
      select device, count(distinct user_id) n from public.app_events where created_at > since group by device) z), '{}'::jsonb),
    'recent', coalesce((select jsonb_agg(r order by r->>'at' desc) from (
      select jsonb_build_object('user_id', user_id, 'at', created_at, 'device', device, 'standalone', standalone, 'version', version) r
      from public.app_events where event = 'open' order by created_at desc limit 25) w), '[]'::jsonb),
    'per_user', coalesce((select jsonb_object_agg(user_id, u) from (
      select user_id, jsonb_build_object(
        'opens', count(*) filter (where event = 'open'),
        'actions', count(*) filter (where event <> 'open'),
        'last', max(created_at),
        'device', (array_agg(device order by created_at desc))[1],
        'version', (array_agg(version order by created_at desc))[1],
        'top', (select jsonb_agg(jsonb_build_object('event', e2.event, 'detail', e2.detail, 'n', e2.n)) from (
          select event, detail, count(*) n from public.app_events e where e.user_id = a.user_id and e.created_at > since and e.event <> 'open'
          group by event, detail order by count(*) desc limit 5) e2)) u
      from public.app_events a where created_at > since group by user_id) v), '{}'::jsonb),
    'alert_opens', (select alert_opens from public.admins where user_id = (select auth.uid()))
  ) into result;
  return result;
end
$fn$;
revoke all on function public.admin_usage(integer, text) from public, anon;
grant execute on function public.admin_usage(integer, text) to authenticated;

create or replace function public.admin_set_open_alerts(p_on boolean) returns boolean
language plpgsql security definer set search_path = '' as $fn$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  update public.admins set alert_opens = coalesce(p_on, false) where user_id = (select auth.uid());
  return coalesce(p_on, false);
end
$fn$;
revoke all on function public.admin_set_open_alerts(boolean) from public, anon;
grant execute on function public.admin_set_open_alerts(boolean) to authenticated;

select cron.unschedule('wallet-usage-cleanup') where exists (select 1 from cron.job where jobname = 'wallet-usage-cleanup');
select cron.schedule('wallet-usage-cleanup', '17 3 * * *', $job$ delete from public.app_events where created_at < now() - interval '180 days' $job$);
