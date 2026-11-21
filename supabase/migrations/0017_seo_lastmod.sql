-- Date of the last real change of a clinic or vet profile: used as <lastmod> in the sitemaps.
alter table public.practices add column if not exists updated_at timestamptz not null default now();
alter table public.practitioners add column if not exists updated_at timestamptz not null default now();

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists practices_touch on public.practices;
create trigger practices_touch before update on public.practices for each row
  when (old.* is distinct from new.*) execute function public.touch_updated_at();
drop trigger if exists practitioners_touch on public.practitioners;
create trigger practitioners_touch before update on public.practitioners for each row
  when (old.* is distinct from new.*) execute function public.touch_updated_at();
