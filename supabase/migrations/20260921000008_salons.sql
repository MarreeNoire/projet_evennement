-- =============================================================================
--  0008 — Salons communautaires : tables (cf. §7 et §13 du cahier)
--  Les fonctions d'accès associées sont définies dans 0014_functions.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- salons : salle communautaire rattachée à un événement ou récurrente
-- -----------------------------------------------------------------------------
create table if not exists public.salons (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid references public.events (id) on delete cascade,
  organization_id   uuid references public.organizations (id) on delete cascade,
  name              text not null,
  slug              citext not null unique,
  description       text,
  cover_url         text,
  privacy           public.salon_privacy not null default 'members',
  access_level      public.access_level not null default 'standard',
  is_recurring      boolean not null default false,
  require_ticket    boolean not null default true,
  member_count      integer not null default 0,
  post_count        integer not null default 0,
  auto_join         boolean not null default true,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint salons_slug_format check (slug ~ '^[a-z0-9-]{3,80}$'),
  constraint salons_scope check (event_id is not null or organization_id is not null),
  constraint salons_recurring_no_event check (is_recurring = false or event_id is null)
);

comment on table public.salons is
  'Salon communautaire : cœur social de la plateforme (public, membres, VIP, récurrent).';
comment on column public.salons.access_level is
  'Niveau de billet minimum requis pour rejoindre le salon (salons VIP).';
comment on column public.salons.require_ticket is
  'Vrai si un billet payé est nécessaire pour accéder au salon.';
comment on column public.salons.archived_at is
  'Date d''archivage : le salon passe en lecture seule.';

create index if not exists salons_event_idx on public.salons (event_id);
create index if not exists salons_org_idx on public.salons (organization_id);
create index if not exists salons_privacy_idx on public.salons (privacy);

drop trigger if exists salons_set_updated_at on public.salons;
create trigger salons_set_updated_at
  before update on public.salons
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- salon_members : appartenance et rôle dans un salon
-- -----------------------------------------------------------------------------
create table if not exists public.salon_members (
  id            uuid primary key default gen_random_uuid(),
  salon_id      uuid not null references public.salons (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  role          public.org_role not null default 'manager',
  is_muted      boolean not null default false,
  joined_at     timestamptz not null default now(),
  left_at       timestamptz,
  last_read_at  timestamptz not null default now(),
  unique (salon_id, user_id)
);

comment on table public.salon_members is
  'Appartenance d''un utilisateur à un salon, avec rôle et état de lecture.';
comment on column public.salon_members.role is
  'owner = organisateur du salon, moderator = modérateur du salon.';
comment on column public.salon_members.last_read_at is
  'Sert au calcul des publications non lues et du badge de notification.';

create index if not exists salon_members_salon_idx on public.salon_members (salon_id, joined_at desc);
create index if not exists salon_members_user_idx on public.salon_members (user_id, left_at);