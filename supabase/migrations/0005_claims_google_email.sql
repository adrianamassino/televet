-- Claims are verified with the clinic's Google Business Profile + a code sent to a work e-mail
-- (no phone/SMS). Only the Google place_id is stored (allowed by Google Maps Platform terms).
alter table public.directory_listings add column if not exists google_place_id text unique;
alter table public.listing_claims add column if not exists email text;
alter table public.listing_claims drop constraint if exists listing_claims_method_check;
update public.listing_claims set method = 'document' where method = 'sms';
alter table public.listing_claims add constraint listing_claims_method_check check (method in ('email_domain','document'));
