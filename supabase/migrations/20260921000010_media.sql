-- =============================================================================
--  0010 — Photos, albums et souvenirs (cf. §19 du cahier)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- albums : regroupements de photos (« Avant », « Jour 1 », « After party »…)
-- -----------------------------------------------------------------------------
create table if not exists public.albums (
  id            uuid primary key default gen_random_uuid(),
  salon_id      uuid not null references public.salons (id) on delete cascade,
  event_id      uuid references public.events (id) on delete cascade,
  name          text not null,
  description   text,
  cover_url     text,
  position      integer not null default 0,
  media_count   integer not null default 0,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.albums is 'Album photo d''un salon (souvenirs de l''événement).';

create index if not exists albums_salon_idx on public.albums (salon_id, position);

drop trigger if exists albums_set_updated_at on public.albums;
create trigger albums_set_updated_at
  before update on public.albums
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- media : photos et vidéos publiées dans un salon
-- -----------------------------------------------------------------------------
create table if not exists public.media (
  id               uuid primary key default gen_random_uuid(),
  salon_id         uuid not null references public.salons (id) on delete cascade,
  event_id         uuid references public.events (id) on delete cascade,
  album_id         uuid references public.albums (id) on delete set null,
  post_id          uuid references public.posts (id) on delete set null,
  uploader_id      uuid references public.profiles (id) on delete set null,
  kind             public.media_kind not null default 'image',
  storage_path     text not null,
  url              text not null,
  thumbnail_url    text,
  caption          text,
  width            integer,
  height           integer,
  duration_seconds integer,
  size_bytes       bigint,
  reaction_count   integer not null default 0,
  comment_count    integer not null default 0,
  is_hidden        boolean not null default false,
  hidden_by        uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),

  constraint media_size_positive check (size_bytes is null or size_bytes > 0),
  constraint media_duration_positive check (duration_seconds is null or duration_seconds > 0)
);

comment on table public.media is 'Photo ou vidéo publiée dans un salon.';
comment on column public.media.storage_path is
  'Chemin dans Supabase Storage, utilisé pour la suppression du fichier.';

create index if not exists media_salon_idx on public.media (salon_id, created_at desc);
create index if not exists media_album_idx on public.media (album_id, created_at desc);
create index if not exists media_uploader_idx on public.media (uploader_id, created_at desc);
create index if not exists media_visible_idx on public.media (salon_id, is_hidden, created_at desc);

-- -----------------------------------------------------------------------------
-- Signalements de contenus — cible polymorphe (cf. §45 du cahier)
-- -----------------------------------------------------------------------------
create table if not exists public.reports (
  id             uuid primary key default gen_random_uuid(),
  reporter_id    uuid references public.profiles (id) on delete set null,
  target_type    public.report_target not null,
  target_id      uuid not null,
  salon_id       uuid references public.salons (id) on delete set null,
  event_id       uuid references public.events (id) on delete set null,
  reason         public.report_reason not null,
  details        text,
  status         public.report_status not null default 'open',
  reviewed_by    uuid references public.profiles (id) on delete set null,
  reviewed_at    timestamptz,
  resolution     text,
  created_at     timestamptz not null default now(),

  constraint reports_details_length check (details is null or char_length(details) <= 2000)
);

comment on table public.reports is 'Signalement d''un contenu ou d''un compte, traité par la modération.';

create index if not exists reports_status_idx on public.reports (status, created_at desc);
create index if not exists reports_target_idx on public.reports (target_type, target_id);
create index if not exists reports_reporter_idx on public.reports (reporter_id, created_at desc);

-- Un même utilisateur ne signale pas deux fois la même cible.
create unique index if not exists reports_unique_per_user
  on public.reports (reporter_id, target_type, target_id);