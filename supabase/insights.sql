create or replace function public.admin_insights(p_tz text default 'UTC') returns jsonb
language plpgsql stable security definer set search_path = '' as $fn$
declare
  tz text := coalesce((select name from pg_catalog.pg_timezone_names where name = p_tz), 'UTC');
  result jsonb;
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  with u as (select id, created_at from auth.users where deleted_at is null),
  act as (select user_id, max(created_at) last, min(created_at) first from public.app_events group by user_id),
  tx as (select user_id, count(*) n, min(created_at) first from public.transactions where deleted_at is null group by user_id)
  select jsonb_build_object(
    'signups', coalesce((select jsonb_agg(jsonb_build_object('day', d, 'n', n) order by d) from (
      select to_char(created_at at time zone tz, 'YYYY-MM-DD') d, count(*) n from u where created_at > now() - interval '30 days' group by 1) s), '[]'::jsonb),
    'entries', coalesce((select jsonb_agg(jsonb_build_object('day', d, 'n', n, 'users', us) order by d) from (
      select to_char(created_at at time zone tz, 'YYYY-MM-DD') d, count(*) n, count(distinct user_id) us from public.transactions where created_at > now() - interval '30 days' and deleted_at is null and id not like 'gx-%' group by 1) s), '[]'::jsonb),
    'kinds', coalesce((select jsonb_object_agg(kind, n) from (select kind, count(*) n from public.transactions where deleted_at is null and created_at > now() - interval '30 days' group by kind) k), '{}'::jsonb),
    'hours', coalesce((select jsonb_object_agg(hr, n) from (select extract(hour from created_at at time zone tz)::int hr, count(*) n from public.app_events where event = 'open' and created_at > now() - interval '30 days' group by 1) hh), '{}'::jsonb),
    'weekdays', coalesce((select jsonb_object_agg(wd, n) from (select extract(isodow from created_at at time zone tz)::int wd, count(*) n from public.app_events where event = 'open' and created_at > now() - interval '30 days' group by 1) ww), '{}'::jsonb),
    'funnel', jsonb_build_object(
      'signed_up', (select count(*) from u),
      'opened', (select count(*) from u join act on act.user_id = u.id),
      'first_entry', (select count(*) from u join tx on tx.user_id = u.id),
      'ten_entries', (select count(*) from u join tx on tx.user_id = u.id where tx.n >= 10),
      'fifty_entries', (select count(*) from u join tx on tx.user_id = u.id where tx.n >= 50)),
    'retention', jsonb_build_object(
      'week_cohort', (select count(*) from u where created_at < now() - interval '7 days'),
      'week_back', (select count(*) from u join act on act.user_id = u.id where u.created_at < now() - interval '7 days' and act.last > now() - interval '7 days'),
      'day1', (select count(distinct u.id) from u join public.app_events e on e.user_id = u.id where u.created_at < now() - interval '1 day' and e.created_at between u.created_at + interval '20 hours' and u.created_at + interval '48 hours'),
      'day1_cohort', (select count(*) from u where created_at < now() - interval '2 days')),
    'adoption', jsonb_build_object(
      'loans', (select count(distinct user_id) from public.people where deleted_at is null),
      'groups', (select count(distinct user_id) from public.group_members where joined),
      'bills', (select count(distinct user_id) from public.rules where remind is not null and deleted_at is null),
      'repeats', (select count(distinct user_id) from public.rules where remind is null and deleted_at is null),
      'budgets', (select count(distinct user_id) from public.categories where deleted_at is null and budget is not null and budget > 0),
      'receipts', (select count(distinct user_id) from public.transactions where receipt is not null and deleted_at is null),
      'reminders', (select count(distinct user_id) from public.push_subs where enabled),
      'quick_add', (select count(*) from public.quick_tokens),
      'reports', (select count(distinct user_id) from public.report_log),
      'installed', (select count(distinct user_id) from public.app_events where standalone and created_at > now() - interval '30 days')),
    'groups', jsonb_build_object(
      'total', (select count(*) from public.groups),
      'members', (select count(*) from public.group_members where joined),
      'pending', (select count(*) from public.group_members where not joined),
      'email_invites', (select count(*) from public.group_email_invites)),
    'versions', coalesce((select jsonb_object_agg(v, n) from (select coalesce(version, '?') v, count(*) n from (select distinct on (user_id) user_id, version from public.app_events where created_at > now() - interval '30 days' order by user_id, created_at desc) lv group by 1) vv), '{}'::jsonb),
    'quiet', coalesce((select jsonb_agg(jsonb_build_object('user_id', u.id, 'last', act.last, 'entries', coalesce(tx.n, 0)) order by act.last) from u join act on act.user_id = u.id left join tx on tx.user_id = u.id where act.last < now() - interval '10 days'), '[]'::jsonb),
    'never', coalesce((select jsonb_agg(jsonb_build_object('user_id', u.id, 'created', u.created_at) order by u.created_at desc) from u left join tx on tx.user_id = u.id where tx.user_id is null and u.created_at < now() - interval '1 day'), '[]'::jsonb),
    'langs', coalesce((select jsonb_object_agg(detail, n) from (select detail, count(distinct user_id) n from public.app_events where event = 'lang' and created_at > now() - interval '30 days' and detail is not null group by detail) lg), '{}'::jsonb),
    'errors', coalesce((select jsonb_agg(jsonb_build_object('detail', detail, 'n', n, 'users', us, 'last', last) order by last desc) from (
      select detail, count(*) n, count(distinct user_id) us, max(created_at) last from public.app_events where event = 'error' and created_at > now() - interval '14 days' group by detail order by max(created_at) desc limit 15) er), '[]'::jsonb)
  ) into result;
  return result;
end
$fn$;
revoke all on function public.admin_insights(text) from public, anon;
grant execute on function public.admin_insights(text) to authenticated;
