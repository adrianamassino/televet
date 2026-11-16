-- Vet dashboard features carried over from the old app.televet.co
alter table public.practices add column if not exists logo_url text;
alter table public.practices add column if not exists booking_enabled boolean not null default true;   -- "activer / désactiver les rendez-vous en ligne"
alter table public.practices add column if not exists widget_title text;                                -- title shown on the public booking page / widget
alter table public.practices add column if not exists email_language text;                              -- language of the e-mails sent to owners
alter table public.practitioners add column if not exists photo_url text;
alter table public.practitioners add column if not exists lead_time_min int not null default 120 check (lead_time_min between 0 and 20160); -- "prochaine disponibilité (minutes)"
alter table public.services add column if not exists weekdays int[] not null default '{0,1,2,3,4,5,6}';  -- days of the week this consultation is offered

-- Photos: public bucket, each user can only write inside their own folder.
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
drop policy if exists "avatars read" on storage.objects;
create policy "avatars read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars write own" on storage.objects;
create policy "avatars write own" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars delete own" on storage.objects;
create policy "avatars delete own" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
