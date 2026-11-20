-- Mobile apps (Televet for owners, Televet Pro for vets): one row per phone that accepted push notifications.
-- Written and read only by the server (service role): RLS is on and there is no policy for browsers or apps.
create table if not exists public.push_tokens (
  token text primary key,                                   -- Expo push token of one app installation
  user_id uuid not null references auth.users(id) on delete cascade,
  app text not null check (app in ('owner','vet')),
  platform text not null check (platform in ('ios','android')),
  language text not null default 'en',
  updated_at timestamptz not null default now()
);
create index if not exists push_tokens_user on public.push_tokens (user_id, app);
alter table public.push_tokens enable row level security;
grant all on public.push_tokens to service_role;
