-- SEO phase 2: cities, physical locations of a clinic, and vets linked to one or more locations.
-- Clinic (practices) = the organisation; practice_locations = its physical sites; a vet can work at several sites.

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  country text not null references public.countries(code),
  slug text not null,                                  -- url piece, from the local name ("paris", "reggio-emilia")
  name text not null,                                  -- local spelling ("Paris", "Reggio nell'Emilia")
  names jsonb not null default '{}'::jsonb,            -- other languages when they differ: {"it":"Parigi"}
  region text,
  lat double precision, lng double precision,
  created_at timestamptz not null default now(),
  unique (country, slug)
);

create table if not exists public.practice_locations (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  slug text not null,
  name text,                                           -- only when the site has its own name ("Clinique X — Bastille")
  address text, postal_code text,
  city_id uuid references public.cities(id),
  lat double precision, lng double precision,
  phone text,                                          -- public number of this site, given by the clinic
  is_primary boolean not null default false,
  emergency boolean not null default false,            -- declared by the clinic; shown only when verified
  emergency_verified_at timestamptz,
  verified_at timestamptz,                             -- address checked (geocoded or by Televet)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (practice_id, slug)
);
create unique index if not exists practice_locations_one_primary on public.practice_locations (practice_id) where is_primary;
create index if not exists practice_locations_city on public.practice_locations (city_id);

create table if not exists public.practitioner_affiliations (
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  location_id uuid not null references public.practice_locations(id) on delete cascade,
  role text not null default 'associate' check (role in ('owner','medical_director','associate')),
  created_at timestamptz not null default now(),
  primary key (practitioner_id, location_id)
);
create index if not exists affiliations_location on public.practitioner_affiliations (location_id);

alter table public.directory_listings add column if not exists city_id uuid references public.cities(id);
alter table public.directory_listings add column if not exists last_checked_at timestamptz;
alter table public.directory_listings add column if not exists show_phone boolean not null default false;  -- only when the number is public and its display is allowed

-- Read: public (the same facts are on the public profile pages). Write: the clinic's own account, or the server.
alter table public.cities enable row level security;
alter table public.practice_locations enable row level security;
alter table public.practitioner_affiliations enable row level security;
drop policy if exists "cities read" on public.cities;
create policy "cities read" on public.cities for select using (true);
drop policy if exists "locations read" on public.practice_locations;
create policy "locations read" on public.practice_locations for select
  using (exists (select 1 from public.practices p where p.id = practice_id and p.published) or public.owns_practice(practice_id));
drop policy if exists "locations write" on public.practice_locations;
create policy "locations write" on public.practice_locations for all using (public.owns_practice(practice_id)) with check (public.owns_practice(practice_id));
drop policy if exists "affiliations read" on public.practitioner_affiliations;
create policy "affiliations read" on public.practitioner_affiliations for select using (true);
drop policy if exists "affiliations write" on public.practitioner_affiliations;
create policy "affiliations write" on public.practitioner_affiliations for all
  using (public.owns_practitioner(practitioner_id) and exists (select 1 from public.practice_locations l join public.practitioners v on v.practice_id = l.practice_id where l.id = location_id and v.id = practitioner_id))
  with check (public.owns_practitioner(practitioner_id) and exists (select 1 from public.practice_locations l join public.practitioners v on v.practice_id = l.practice_id where l.id = location_id and v.id = practitioner_id));
grant select on public.cities, public.practice_locations, public.practitioner_affiliations to anon, authenticated;
grant insert, update, delete on public.practice_locations, public.practitioner_affiliations to authenticated;
grant all on public.cities, public.practice_locations, public.practitioner_affiliations to service_role;

drop trigger if exists practice_locations_touch on public.practice_locations;
create trigger practice_locations_touch before update on public.practice_locations for each row
  when (old.* is distinct from new.*) execute function public.touch_updated_at();

-- Every existing clinic gets its primary location from its current address, and its vets are linked to it.
-- The city is attached afterwards by the server (/api/cron/seo-sync), which locates the address.
insert into public.practice_locations (practice_id, slug, address, postal_code, is_primary)
select p.id, 'main', p.address, p.postal_code, true from public.practices p
where not exists (select 1 from public.practice_locations l where l.practice_id = p.id);
insert into public.practitioner_affiliations (practitioner_id, location_id, role)
select v.id, l.id, 'associate' from public.practitioners v join public.practice_locations l on l.practice_id = v.practice_id and l.is_primary
on conflict do nothing;
