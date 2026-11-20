-- Commission can now be a fixed fee ADDED to the vet's price (in cents: 1000 = 10.00) instead of a percentage.
-- Rule at each level (vet → clinic → country): if commission_fixed_cents is set it wins, otherwise commission_pct is used.
alter table public.practices add column if not exists commission_fixed_cents int check (commission_fixed_cents is null or commission_fixed_cents >= 0);
alter table public.practitioners add column if not exists commission_fixed_cents int check (commission_fixed_cents is null or commission_fixed_cents >= 0);
alter table public.countries add column if not exists default_commission_fixed_cents int check (default_commission_fixed_cents is null or default_commission_fixed_cents >= 0);

-- Clinics and vets still cannot change their own commission from the browser.
create or replace function public.practices_guard() returns trigger language plpgsql as $$
begin
  if auth.uid() is null then return new; end if;
  if tg_op = 'INSERT' then
    new.published := false; new.commission_pct := null; new.commission_fixed_cents := null;
    new.review_status := 'pending'; new.reviewed_at := null; new.reviewed_by := null; new.review_note := null;
    new.stripe_account_id := null; new.stripe_status := 'none'; new.mp_user_id := null; new.mp_status := 'none';
    new.onboarding_reminders := 0; new.onboarding_reminded_at := null;
  else
    new.published := old.published; new.commission_pct := old.commission_pct; new.commission_fixed_cents := old.commission_fixed_cents;
    new.review_status := old.review_status; new.reviewed_at := old.reviewed_at; new.reviewed_by := old.reviewed_by; new.review_note := old.review_note;
    new.stripe_account_id := old.stripe_account_id; new.stripe_status := old.stripe_status;
    new.mp_user_id := old.mp_user_id; new.mp_status := old.mp_status;
    new.owner_user_id := old.owner_user_id; new.country := old.country;
    new.onboarding_reminders := old.onboarding_reminders; new.onboarding_reminded_at := old.onboarding_reminded_at;
  end if;
  return new;
end $$;

create or replace function public.practitioners_guard() returns trigger language plpgsql as $$
begin
  if auth.uid() is null then return new; end if;
  if tg_op = 'INSERT' then new.commission_pct := null; new.commission_fixed_cents := null; new.approved := false; new.approved_at := null;
  else new.commission_pct := old.commission_pct; new.commission_fixed_cents := old.commission_fixed_cents; new.approved := old.approved; new.approved_at := old.approved_at; end if;
  return new;
end $$;
