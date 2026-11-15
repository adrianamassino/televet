-- Integrated video consultations (Daily) + e-mail reminders
alter table public.practitioners add column if not exists video_link text;          -- optional custom link (overrides Televet video)
alter table public.practices add column if not exists reminders jsonb not null default '{"e24": true, "e2": true}'::jsonb;
alter table public.bookings add column if not exists video_url text;                -- Daily room URL (never exposed without a token)
alter table public.bookings add column if not exists confirmation_sent_at timestamptz;
alter table public.bookings add column if not exists reminder_24h_sent_at timestamptz;
alter table public.bookings add column if not exists reminder_2h_sent_at timestamptz;
create index if not exists bookings_reminders_idx on public.bookings (status, starts_at);
