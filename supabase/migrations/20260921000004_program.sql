-- =============================================================================
--  0004 — Programme : sessions, intervenants, programme personnel
-- =============================================================================

-- -----------------------------------------------------------------------------
-- event_sessions : programme interactif (cf. §20 du cahier)
-- -----------------------------------------------------------------------------
create table if not exists public.event_sessions (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events (id) on delete cascade,
  title        text not null,
  description  text,
  room         text,
  start_at     timestamptz not null,
  end_at       timestamptz not null,
  position     integer not null default 0,
  is_break     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint event_sessions_dates_order check (end_at >= start_at)
);

comment on table public.event_sessions is 'Session du programme d''un événement.';

create index if not exists event_sessions_event_idx
  on public.event_sessions (event_id, start_at, position);

drop trigger if exists event_sessions_set_updated_at on public.event_sessions;
create trigger event_sessions_set_updated_at
  before update on public.event_sessions
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- event_speakers : intervenants, rattachables à une session
-- -----------------------------------------------------------------------------
create table if not exists public.event_speakers (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  session_id    uuid references public.event_sessions (id) on delete set null,
  user_id       uuid references public.profiles (id) on delete set null,
  name          text not null,
  role_title    text,
  organization  text,
  bio           text,
  photo_url     text,
  links         jsonb not null default '{}'::jsonb,
  position      integer not null default 0,
  created_at    timestamptz not null default now(),

  constraint event_speakers_links_object check (jsonb_typeof(links) = 'object')
);

comment on table public.event_speakers is 'Intervenant d''un événement ou d''une session.';

create index if not exists event_speakers_event_idx on public.event_speakers (event_id, position);
create index if not exists event_speakers_session_idx on public.event_speakers (session_id);

-- -----------------------------------------------------------------------------
-- event_session_bookmarks : programme personnel d'un participant
-- -----------------------------------------------------------------------------
create table if not exists public.event_session_bookmarks (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.event_sessions (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (session_id, user_id)
);

comment on table public.event_session_bookmarks is
  'Sessions enregistrées par un participant dans son programme personnel.';

create index if not exists event_session_bookmarks_user_idx
  on public.event_session_bookmarks (user_id);