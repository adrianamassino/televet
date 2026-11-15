-- Consultation reports: AI draft from the video transcript, validated by the vet, then sent to the owner
alter table public.bookings add column if not exists transcript_consent boolean not null default false;

create table public.consultation_reports (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','sent')),
  ai_generated boolean not null default false,
  fields jsonb not null default '{}'::jsonb,       -- {reason, observations, advice, follow_up, warning_signs}
  validated_by uuid references auth.users(id),
  validated_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
-- transcripts are kept server-side only, and deleted once the report is sent
create table public.consultation_transcripts (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);
alter table public.consultation_reports enable row level security;
alter table public.consultation_transcripts enable row level security;

create policy "report vet" on public.consultation_reports for select
  using (exists (select 1 from bookings b where b.id = booking_id and owns_practice(b.practice_id)));
create policy "report owner when sent" on public.consultation_reports for select
  using (status = 'sent' and exists (select 1 from bookings b where b.id = booking_id and b.owner_id = auth.uid()));
