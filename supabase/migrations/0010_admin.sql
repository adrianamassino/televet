-- Televet back-office: approval workflow for clinics and vets, commission audit trail.

-- 1) Review status of a practice (clinic / independent vet / home-visit vet).
--    'published' stays the single switch that makes it public; the admin API keeps both in sync.
alter table public.practices add column if not exists review_status text not null default 'pending'
  check (review_status in ('pending','approved','rejected','suspended'));
alter table public.practices add column if not exists reviewed_at timestamptz;
alter table public.practices add column if not exists reviewed_by text;
alter table public.practices add column if not exists review_note text;
update public.practices set review_status = 'approved' where published = true and review_status = 'pending';

-- 2) Each vet of a clinic must be approved too. Existing vets are grandfathered in.
alter table public.practitioners add column if not exists approved boolean not null default false;
alter table public.practitioners add column if not exists approved_at timestamptz;
update public.practitioners set approved = true, approved_at = now();

-- 3) A vet/clinic can never approve itself or touch its commission from the browser (RLS requests carry auth.uid()).
create or replace function public.practices_guard() returns trigger language plpgsql as $$
begin
  if auth.uid() is null then return new; end if;
  if tg_op = 'INSERT' then
    new.published := false; new.commission_pct := null;
    new.review_status := 'pending'; new.reviewed_at := null; new.reviewed_by := null; new.review_note := null;
    new.stripe_account_id := null; new.stripe_status := 'none'; new.mp_user_id := null; new.mp_status := 'none';
  else
    new.published := old.published; new.commission_pct := old.commission_pct;
    new.review_status := old.review_status; new.reviewed_at := old.reviewed_at; new.reviewed_by := old.reviewed_by; new.review_note := old.review_note;
    new.stripe_account_id := old.stripe_account_id; new.stripe_status := old.stripe_status;
    new.mp_user_id := old.mp_user_id; new.mp_status := old.mp_status;
    new.owner_user_id := old.owner_user_id; new.country := old.country;
  end if;
  return new;
end $$;

create or replace function public.practitioners_guard() returns trigger language plpgsql as $$
begin
  if auth.uid() is null then return new; end if;
  if tg_op = 'INSERT' then new.commission_pct := null; new.approved := false; new.approved_at := null;
  else new.commission_pct := old.commission_pct; new.approved := old.approved; new.approved_at := old.approved_at; end if;
  return new;
end $$;

-- 4) Audit log of every admin action (service role only: RLS on, no policy).
create table if not exists public.admin_audit (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor text not null,
  action text not null,
  target_type text not null,
  target_id text,
  target_label text,
  detail jsonb not null default '{}'::jsonb
);
alter table public.admin_audit enable row level security;
create index if not exists admin_audit_created on public.admin_audit (created_at desc);

create index if not exists practices_review on public.practices (review_status, created_at desc);
create index if not exists bookings_practice_starts on public.bookings (practice_id, starts_at desc);
create index if not exists bookings_owner on public.bookings (owner_id);
