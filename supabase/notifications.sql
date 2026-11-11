create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  sender uuid references auth.users (id) on delete set null,
  target_user uuid references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  body text not null check (char_length(body) between 1 and 180),
  devices integer not null default 0,
  sent integer not null default 0
);
create index if not exists notifications_target_idx on public.notifications (target_user, created_at desc);
create index if not exists notifications_sender_idx on public.notifications (sender);
alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select, delete on public.notifications to authenticated;
grant select, insert on public.notifications to service_role;
drop policy if exists "notifications read" on public.notifications;
drop policy if exists "notifications admin delete" on public.notifications;
create policy "notifications read" on public.notifications for select to authenticated using (target_user is null or target_user = (select auth.uid()) or (select public.is_admin()));
create policy "notifications admin delete" on public.notifications for delete to authenticated using ((select public.is_admin()));
