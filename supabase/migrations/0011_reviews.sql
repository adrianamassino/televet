-- Post-appointment satisfaction survey (1–5 stars). 5 stars → invitation to leave a Google review.
alter table public.bookings add column if not exists review_token uuid not null default gen_random_uuid();
alter table public.bookings add column if not exists review_sent_at timestamptz;
alter table public.bookings add column if not exists review_rating int check (review_rating between 1 and 5);
alter table public.bookings add column if not exists review_comment text;
alter table public.bookings add column if not exists review_at timestamptz;
create unique index if not exists bookings_review_token on public.bookings (review_token);
create index if not exists bookings_review_due on public.bookings (ends_at) where review_sent_at is null;
-- appointments already in the past when this ships must not be surveyed retroactively
update public.bookings set review_sent_at = now() where ends_at < now() and review_sent_at is null;
