-- Public profile pages (clinic + vet), Doctolib-style. All columns optional: sections with no data are hidden on the page.
alter table public.practices
  add column if not exists city text,
  add column if not exists cover_url text,
  add column if not exists website text,
  add column if not exists founded_year int,
  add column if not exists facilities text[] not null default '{}',       -- parking, wheelchair, pharmacy, lab, xray, ultrasound, hospitalisation, emergency, surgery
  add column if not exists payment_methods text[] not null default '{}',  -- card, cash, cheque, transfer, contactless
  add column if not exists access_info text;                              -- how to get there: metro, bus, parking

alter table public.practitioners
  add column if not exists slug text,
  add column if not exists title text,                                    -- "Dr", "Dre", "Dott.", "Dra."
  add column if not exists specialties text[] not null default '{}',
  add column if not exists bio text,
  add column if not exists languages text[] not null default '{}',
  add column if not exists species text[] not null default '{}',
  add column if not exists school text,
  add column if not exists experience_years int check (experience_years between 0 and 70);
create unique index if not exists practitioners_practice_slug_key on public.practitioners (practice_id, slug) where slug is not null;
