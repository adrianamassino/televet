-- Website chat assistant: every conversation is stored so Televet staff can read it in the admin area.
-- Tables are reachable ONLY through the server (service role): RLS is on and no policy is defined.
create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  lang text not null default 'fr',
  country text not null default 'FR',
  page_path text,                                            -- page where the chat was opened
  audience text not null default 'unknown' check (audience in ('owner','vet','unknown')),
  urgency text not null default 'none' check (urgency in ('none','urgent','emergency')),
  topic text,                                                -- short label chosen by the assistant
  message_count int not null default 0,
  status text not null default 'new' check (status in ('new','needs_followup','handled','archived')),
  cta_clicked text[] not null default '{}',                  -- which buttons the visitor clicked (booking, sign-up…)
  staff_note text,
  handled_by uuid references auth.users(id),
  handled_at timestamptz
);
create table public.chat_messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  meta jsonb not null default '{}'::jsonb,                   -- assistant turns: {cta:[…], urgency, model}
  ip_hash text,                                              -- HMAC of the IP, only for rate limiting (never the IP itself)
  created_at timestamptz not null default now()
);
create index on public.chat_conversations (last_message_at desc);
create index on public.chat_conversations (status, last_message_at desc);
create index on public.chat_conversations (audience, urgency);
create index on public.chat_messages (conversation_id, id);
create index on public.chat_messages (ip_hash, created_at) where ip_hash is not null;
create index on public.chat_messages (created_at);
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
