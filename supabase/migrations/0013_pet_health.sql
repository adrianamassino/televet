-- Pet health record ("carnet de santé"): photos of the booklet + digitised entries (vaccines, treatments, surgeries…) + reminders.

alter table public.pets add column if not exists microchip text;
alter table public.pets add column if not exists breed text;

create table if not exists public.pet_documents (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  owner_id uuid not null references public.owners(id) on delete cascade,
  kind text not null default 'booklet' check (kind in ('booklet','prescription','lab','other')),
  storage_path text not null,
  scan_status text not null default 'none' check (scan_status in ('none','done','failed')),
  created_at timestamptz not null default now()
);
create index if not exists pet_documents_pet on public.pet_documents (pet_id, created_at desc);

create table if not exists public.pet_health_records (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  owner_id uuid not null references public.owners(id) on delete cascade,
  document_id uuid references public.pet_documents(id) on delete set null,
  kind text not null check (kind in ('vaccine','antiparasitic','treatment','surgery','visit','test','other')),
  name text not null,
  done_on date,
  next_due date,
  vet_name text,
  notes text,
  source text not null default 'manual' check (source in ('manual','scan')),
  remind_30_at timestamptz,
  remind_7_at timestamptz,
  remind_0_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists pet_health_pet on public.pet_health_records (pet_id, done_on desc);
create index if not exists pet_health_due on public.pet_health_records (next_due) where next_due is not null;

alter table public.pet_documents enable row level security;
alter table public.pet_health_records enable row level security;
drop policy if exists "own pet documents" on public.pet_documents;
create policy "own pet documents" on public.pet_documents for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = auth.uid()));
drop policy if exists "own pet records" on public.pet_health_records;
create policy "own pet records" on public.pet_health_records for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = auth.uid()));
grant all on public.pet_documents, public.pet_health_records to authenticated, service_role;

-- Private bucket: each owner can only touch files inside their own folder (<owner id>/…).
insert into storage.buckets (id, name, public) values ('pet-docs', 'pet-docs', false) on conflict (id) do nothing;
drop policy if exists "pet-docs read own" on storage.objects;
create policy "pet-docs read own" on storage.objects for select to authenticated using (bucket_id = 'pet-docs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "pet-docs write own" on storage.objects;
create policy "pet-docs write own" on storage.objects for insert to authenticated with check (bucket_id = 'pet-docs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "pet-docs delete own" on storage.objects;
create policy "pet-docs delete own" on storage.objects for delete to authenticated using (bucket_id = 'pet-docs' and (storage.foldername(name))[1] = auth.uid()::text);
