-- Animals and consultations catalogue (src/lib/species.ts, src/lib/consult-catalog.ts).
-- Pets can now be any animal of the list (guinea pig, tortoise, donkey…), not only the first seven kinds.
-- Older values stay valid ("bird", "rodent"… are categories). Keep this list equal to PET_SPECIES_CODES (a test checks it).
alter table public.pets drop constraint if exists pets_species_check;
alter table public.pets add constraint pets_species_check check (species in ('dog','cat','rabbit','guinea_pig','hamster','rat','mouse','chinchilla','gerbil','degu','ferret','hedgehog','budgie','parrot','cockatiel','canary','pigeon','poultry','tortoise','turtle','lizard','snake','fish','koi','amphibian','horse','pony','donkey','mule','cattle','sheep','goat','pig','camelid','other','rodent','small_mammal','bird','reptile','aquatic','equine','farm'));

-- services.catalog_code now holds the code of a catalogue consultation ("vaccination", "dermatology"…): its name is
-- shown in each visitor's language. Older generic codes (video_consult, home_visit…) and custom wording keep working.
comment on column public.services.catalog_code is 'consultation code from src/lib/consult-catalog.ts, or a generic code (video_consult, home_visit, clinic_visit, tele_expertise)';
