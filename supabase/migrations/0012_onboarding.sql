-- Reminders for incomplete vet profiles (sent by /api/cron/onboarding).
alter table public.practices add column if not exists onboarding_reminders int not null default 0;
alter table public.practices add column if not exists onboarding_reminded_at timestamptz;

-- Owners must not be able to reset the reminder counters themselves (service role / admin only).
create or replace function public.practices_guard() returns trigger language plpgsql as $$
begin
  if auth.uid() is null then return new; end if;
  if tg_op = 'INSERT' then
    new.published := false; new.commission_pct := null;
    new.review_status := 'pending'; new.reviewed_at := null; new.reviewed_by := null; new.review_note := null;
    new.stripe_account_id := null; new.stripe_status := 'none'; new.mp_user_id := null; new.mp_status := 'none';
    new.onboarding_reminders := 0; new.onboarding_reminded_at := null;
  else
    new.published := old.published; new.commission_pct := old.commission_pct;
    new.review_status := old.review_status; new.reviewed_at := old.reviewed_at; new.reviewed_by := old.reviewed_by; new.review_note := old.review_note;
    new.stripe_account_id := old.stripe_account_id; new.stripe_status := old.stripe_status;
    new.mp_user_id := old.mp_user_id; new.mp_status := old.mp_status;
    new.owner_user_id := old.owner_user_id; new.country := old.country;
    new.onboarding_reminders := old.onboarding_reminders; new.onboarding_reminded_at := old.onboarding_reminded_at;
  end if;
  return new;
end $$;
