-- Televet — initial schema (Supabase / PostgreSQL)
-- Run with: supabase db push   (or paste into the Supabase SQL editor)

create extension if not exists btree_gist;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- countries
create table public.countries (
  code text primary key,                 -- ISO 3166-1 alpha-2 (FR, AR, AU…)
  currency text not null,                -- ISO 4217 (EUR, ARS, AUD…)
  languages text[] not null,             -- ['fr','en']
  payment_provider text not null check (payment_provider in ('stripe','mercadopago')),
  default_commission_pct numeric(5,2) not null default 0,
  remote_prescription_allowed boolean not null default false,
  legal_notice jsonb not null default '{}'::jsonb, -- {"fr": "...", "en": "..."}
  published boolean not null default false
);

-- ---------------------------------------------------------------- people
create table public.owners (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  country text references public.countries(code),
  language text not null default 'fr',
  created_at timestamptz not null default now()
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  name text not null,
  species text not null check (species in ('dog','cat','rabbit','ferret','bird','horse','other')),
  birth_year int,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- practices
create table public.practices (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  country text not null references public.countries(code),
  kind text not null check (kind in ('clinic','vet','home')),
  name text not null,
  slug text unique not null,
  headline text,
  about text,
  address text,
  postal_code text,
  lat double precision,
  lng double precision,
  phone text,
  email text,
  timezone text not null default 'Europe/Paris',
  languages text[] not null default '{}',
  species text[] not null default '{}',
  published boolean not null default false,
  -- payments (non-secret identifiers only; secrets live in practice_secrets)
  stripe_account_id text,
  stripe_status text not null default 'none' check (stripe_status in ('none','onboarding','verifying','active','restricted')),
  mp_user_id text,
  mp_status text not null default 'none' check (mp_status in ('none','active','revoked')),
  commission_pct numeric(5,2),          -- overrides the country default when set
  created_at timestamptz not null default now()
);
create index on public.practices (country, published);

create table public.practitioners (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  user_id uuid references auth.users(id),
  display_name text not null,
  commission_pct numeric(5,2),          -- overrides the practice value when set
  active boolean not null default true
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  practitioner_id uuid references public.practitioners(id) on delete cascade,
  type text not null check (type in ('clinic','home','video','expertise')),
  catalog_code text not null,            -- stable id from the Televet catalogue
  custom_name text,                      -- optional display name chosen by the vet
  description text,
  duration_min int not null check (duration_min between 5 and 240),
  price_cents int not null check (price_cents >= 0),
  currency text not null,
  online_payment boolean not null default true,
  confirmation_note text,
  reminder_note text,
  active boolean not null default true
);

create table public.opening_rules (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),   -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  slot_min int not null default 30,
  check (end_time > start_time)
);

create table public.service_zones (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  practitioner_id uuid references public.practitioners(id) on delete cascade,
  mode text not null check (mode in ('postal','radius','polygon')),
  postal_codes text[] not null default '{}',
  center_lat double precision,
  center_lng double precision,
  radius_km numeric,
  polygon jsonb,                          -- [[lat,lng],…]
  extra_fee_cents int not null default 0, -- 0 = main area, >0 = extended area
  weekdays int[] not null default '{0,1,2,3,4,5,6}',
  travel_buffer_min int not null default 15
);

create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  check (ends_at > starts_at)
);

-- ---------------------------------------------------------------- calendars
create table public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  provider text not null check (provider in ('google','ical','vetup','vetit','petbooqz')),
  status text not null default 'active' check (status in ('active','error','revoked')),
  external_calendar_id text,
  last_sync_at timestamptz,
  last_error text,
  legacy_id text,                         -- id of the connection in the old app.televet.co (migration)
  unique (practitioner_id, provider)
);

-- secrets are never readable from the browser (no RLS policy = no access)
create table public.connection_secrets (
  connection_id uuid primary key references public.calendar_connections(id) on delete cascade,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  api_key text,
  ical_url text
);

create table public.practice_secrets (
  practice_id uuid primary key references public.practices(id) on delete cascade,
  mp_access_token text,
  mp_refresh_token text,
  mp_expires_at timestamptz
);

create table public.external_busy (
  id bigserial primary key,
  connection_id uuid not null references public.calendar_connections(id) on delete cascade,
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  source_uid text
);
create index on public.external_busy (practitioner_id, starts_at);

create table public.ical_feeds (
  practitioner_id uuid primary key references public.practitioners(id) on delete cascade,
  token text unique not null default encode(gen_random_bytes(18), 'hex')
);

-- ---------------------------------------------------------------- bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id),
  practitioner_id uuid not null references public.practitioners(id),
  service_id uuid not null references public.services(id),
  owner_id uuid not null references public.owners(id),
  pet_id uuid references public.pets(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  type text not null check (type in ('clinic','home','video','expertise')),
  address text,
  postal_code text,
  access_notes text,
  motive text,
  status text not null default 'pending' check (status in ('pending','confirmed','declined','cancelled')),
  vet_reply text,
  price_cents int not null,
  currency text not null,
  commission_cents int not null default 0,
  provider text check (provider in ('stripe','mercadopago')),
  payment_ref text,                       -- PaymentIntent id or Mercado Pago payment id
  payment_status text not null default 'none' check (payment_status in ('none','pending','authorized','captured','refunded','failed')),
  video_room text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  -- no double booking for the same practitioner (pending or confirmed)
  exclude using gist (practitioner_id with =, tstzrange(starts_at, ends_at) with &&)
    where (status in ('pending','confirmed'))
);
create index on public.bookings (owner_id, starts_at);

-- ---------------------------------------------------------------- RLS
alter table public.countries enable row level security;
alter table public.owners enable row level security;
alter table public.pets enable row level security;
alter table public.practices enable row level security;
alter table public.practitioners enable row level security;
alter table public.services enable row level security;
alter table public.opening_rules enable row level security;
alter table public.service_zones enable row level security;
alter table public.blocks enable row level security;
alter table public.calendar_connections enable row level security;
alter table public.connection_secrets enable row level security;
alter table public.practice_secrets enable row level security;
alter table public.external_busy enable row level security;
alter table public.ical_feeds enable row level security;
alter table public.bookings enable row level security;

create or replace function public.owns_practice(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from practices where id = p and owner_user_id = auth.uid());
$$;
create or replace function public.owns_practitioner(pr uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from practitioners x join practices p on p.id = x.practice_id
                 where x.id = pr and (p.owner_user_id = auth.uid() or x.user_id = auth.uid()));
$$;

create policy "countries readable" on public.countries for select using (true);

create policy "owner self" on public.owners for all using (id = auth.uid()) with check (id = auth.uid());
create policy "pets own" on public.pets for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "practices public read" on public.practices for select using (published or owner_user_id = auth.uid());
create policy "practices owner write" on public.practices for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy "practitioners read" on public.practitioners for select using (
  exists (select 1 from practices p where p.id = practice_id and (p.published or p.owner_user_id = auth.uid())));
create policy "practitioners write" on public.practitioners for all using (owns_practice(practice_id)) with check (owns_practice(practice_id));

create policy "services read" on public.services for select using (
  active and exists (select 1 from practices p where p.id = practice_id and p.published) or owns_practice(practice_id));
create policy "services write" on public.services for all using (owns_practice(practice_id)) with check (owns_practice(practice_id));

create policy "rules read" on public.opening_rules for select using (true);
create policy "rules write" on public.opening_rules for all using (owns_practitioner(practitioner_id)) with check (owns_practitioner(practitioner_id));

create policy "zones read" on public.service_zones for select using (true);
create policy "zones write" on public.service_zones for all using (owns_practice(practice_id)) with check (owns_practice(practice_id));

create policy "blocks own" on public.blocks for all using (owns_practitioner(practitioner_id)) with check (owns_practitioner(practitioner_id));
create policy "connections own" on public.calendar_connections for select using (owns_practitioner(practitioner_id));
create policy "feeds own" on public.ical_feeds for select using (owns_practitioner(practitioner_id));
-- external_busy, connection_secrets, practice_secrets: server only (service role)

create policy "bookings owner read" on public.bookings for select using (owner_id = auth.uid() or owns_practice(practice_id));
-- bookings are created/updated only through the API (service role) so that
-- zone checks, availability checks and payments cannot be bypassed.

-- ---------------------------------------------------------------- seed countries
insert into public.countries (code, currency, languages, payment_provider, published) values
 ('FR','EUR','{fr,en}','stripe',true), ('BE','EUR','{fr,nl,en}','stripe',false), ('CH','CHF','{fr,de,it,en}','stripe',false),
 ('IT','EUR','{it,en}','stripe',false), ('ES','EUR','{es,en}','stripe',false), ('PT','EUR','{pt,en}','stripe',false),
 ('DE','EUR','{de,en}','stripe',false), ('AT','EUR','{de,en}','stripe',false), ('PL','PLN','{pl,en}','stripe',false),
 ('GB','GBP','{en}','stripe',false), ('US','USD','{en,es}','stripe',false), ('AU','AUD','{en}','stripe',false),
 ('MX','MXN','{es,en}','mercadopago',false), ('AR','ARS','{es}','mercadopago',false), ('UY','UYU','{es}','mercadopago',false),
 ('CL','CLP','{es}','mercadopago',false), ('BR','BRL','{pt}','mercadopago',false)
on conflict (code) do nothing;
