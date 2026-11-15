-- Automatic confirmation of bookings (default on; the vet can turn it off in the dashboard).
alter table public.practices add column if not exists auto_confirm boolean not null default true;

-- A vet can edit their own profile from the browser (RLS), but must NOT be able to publish themselves,
-- change their commission, or fake payment status. Requests made with a user JWT have auth.uid() set;
-- the service role (server) does not, so Televet's own code and the Supabase dashboard can still change these fields.
create or replace function public.practices_guard() returns trigger language plpgsql as $$
begin
  if auth.uid() is null then return new; end if;
  if tg_op = 'INSERT' then
    new.published := false; new.commission_pct := null;
    new.stripe_account_id := null; new.stripe_status := 'none'; new.mp_user_id := null; new.mp_status := 'none';
  else
    new.published := old.published; new.commission_pct := old.commission_pct;
    new.stripe_account_id := old.stripe_account_id; new.stripe_status := old.stripe_status;
    new.mp_user_id := old.mp_user_id; new.mp_status := old.mp_status;
    new.owner_user_id := old.owner_user_id; new.country := old.country;
  end if;
  return new;
end $$;
drop trigger if exists practices_guard on public.practices;
create trigger practices_guard before insert or update on public.practices for each row execute function public.practices_guard();

-- same idea for practitioners.commission_pct
create or replace function public.practitioners_guard() returns trigger language plpgsql as $$
begin
  if auth.uid() is null then return new; end if;
  if tg_op = 'INSERT' then new.commission_pct := null; else new.commission_pct := old.commission_pct; end if;
  return new;
end $$;
drop trigger if exists practitioners_guard on public.practitioners;
create trigger practitioners_guard before insert or update on public.practitioners for each row execute function public.practitioners_guard();
