-- Clinic directory (like Doctolib's non-subscribing practitioners): every clinic of the open countries,
-- claimable by the vets who work there.
create extension if not exists pg_trgm;
create extension if not exists unaccent;

create table public.directory_listings (
  id uuid primary key default gen_random_uuid(),
  country text not null references public.countries(code),
  name text not null,
  address text, postal_code text, city text,
  lat double precision, lng double precision,
  phone text, website text,
  source text not null check (source in ('sirene','osm','companies_house','manual','other')),
  source_ref text,                                  -- SIRET, OSM id, company number…
  status text not null default 'unclaimed' check (status in ('unclaimed','claim_pending','claimed','removed')),
  practice_id uuid references public.practices(id) on delete set null,
  slug text unique,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (source, source_ref)
);
create index directory_country_city_idx on public.directory_listings (country, city);
create index directory_postal_idx on public.directory_listings (country, postal_code);
create index directory_name_trgm_idx on public.directory_listings using gin (name gin_trgm_ops);

alter table public.practices add column if not exists listing_id uuid references public.directory_listings(id);

create table public.listing_claims (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.directory_listings(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  method text not null check (method in ('sms','email_domain','document')),
  status text not null default 'pending' check (status in ('pending','verified','rejected','expired')),
  code_hash text, code_expires_at timestamptz, attempts int not null default 0,
  document_path text,                                -- private storage bucket
  reviewed_by uuid references auth.users(id), reviewed_at timestamptz, note text,
  created_at timestamptz not null default now()
);
create unique index one_open_claim_per_user on public.listing_claims (listing_id, user_id) where status = 'pending';

create table public.listing_interest (
  listing_id uuid references public.directory_listings(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  primary key (listing_id, email)
);

alter table public.directory_listings enable row level security;
alter table public.listing_claims enable row level security;
alter table public.listing_interest enable row level security;
create policy "directory public read" on public.directory_listings for select using (status <> 'removed');
create policy "own claims" on public.listing_claims for select using (user_id = auth.uid());

-- fuzzy match used at vet sign-up ("your clinic may already be on Televet")
create or replace function public.directory_match(p_country text, p_name text, p_postal text default null, p_limit int default 5)
returns table (id uuid, name text, address text, postal_code text, city text, score real)
language sql stable as $$
  select d.id, d.name, d.address, d.postal_code, d.city,
         (similarity(unaccent(lower(d.name)), unaccent(lower(p_name))) + case when p_postal is not null and d.postal_code = p_postal then 0.3 else 0 end)::real as score
  from public.directory_listings d
  where d.country = p_country and d.status in ('unclaimed','claim_pending')
    and (unaccent(lower(d.name)) % unaccent(lower(p_name)) or (p_postal is not null and d.postal_code = p_postal))
  order by score desc
  limit p_limit
$$;
