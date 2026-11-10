create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('wallet-reminders', '*/5 * * * *', $job$
 select net.http_post(
  url := 'https://kjzxixqjuhpjuytwtvfv.supabase.co/functions/v1/send-reminders',
  headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select cron_secret from public.push_keys where id = 1)),
  body := '{}'::jsonb)
$job$);
