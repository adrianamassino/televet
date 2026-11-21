-- Home visits: travel time around each visit, a readable label for the vet's zones, and the confirmation rule.

-- Minutes the vet needs between a home visit and the appointment before / after it (set by the vet, default 30).
alter table public.practitioners add column if not exists travel_min int not null default 30 check (travel_min between 0 and 240);
-- Travel time actually reserved around one home visit: copied from the vet's setting when the booking is made,
-- so changing the setting later never moves the free time of visits already booked. 0 for other appointment types.
alter table public.bookings add column if not exists travel_min int not null default 0 check (travel_min between 0 and 240);
-- Address shown in the editor for a "radius around an address" zone (the coordinates alone are not readable).
alter table public.service_zones add column if not exists label text;

-- Confirmation: a booking is confirmed by itself when the vet has a synced calendar (Google Calendar…) or has switched
-- "automatic confirmation" on; otherwise the vet receives a request to accept. The switch is therefore off unless chosen.
do $$ begin
  -- runs once, the first time this file is applied (recognised by the comment set just below)
  if coalesce(col_description('public.practices'::regclass, (select attnum from pg_attribute where attrelid = 'public.practices'::regclass and attname = 'auto_confirm')), '') not like 'v2:%' then
    update public.practices set auto_confirm = false;
  end if;
end $$;
alter table public.practices alter column auto_confirm set default false;
comment on column public.practices.auto_confirm is 'v2: confirm bookings automatically even without a synced calendar (off by default)';

-- A zone can hold the address a vet starts from (often their home): only the vet's own account may read the rows.
-- The site checks an address against the zones on the server and shows clients a short summary without the street.
drop policy if exists "zones read" on public.service_zones;
grant select, insert, update, delete on public.service_zones to authenticated;
grant all on public.service_zones to service_role;
