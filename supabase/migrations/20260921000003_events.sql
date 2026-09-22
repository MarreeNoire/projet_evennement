-- =============================================================================
--  0003 — Événements : table principale
-- =============================================================================

create table if not exists public.events (
  id                       uuid primary key default gen_random_uuid(),
  organization_id          uuid not null references public.organizations (id) on delete cascade,
  created_by               uuid not null references public.profiles (id) on delete restrict,
  title                    text not null,
  slug                     citext not null unique,
  summary                  text,
  description              text,
  cover_url                text,
  gallery                  text[] not null default '{}',
  category                 text not null default 'autres',
  tags                     text[] not null default '{}',

  -- Lieu
  venue_name               text,
  address                  text,
  city                     text not null default 'Abidjan',
  country                  text not null default 'Côte d''Ivoire',
  latitude                 numeric(9, 6),
  longitude                numeric(9, 6),
  online_url               text,

  -- Dates
  start_at                 timestamptz not null,
  end_at                   timestamptz not null,
  timezone                 text not null default 'Africa/Abidjan',

  -- Publication
  status                   public.event_status not null default 'draft',
  published_at             timestamptz,

  -- Salon communautaire associé
  salon_privacy            public.salon_privacy not null default 'members',
  salon_open_before_hours  integer not null default 168,
  salon_open_after_hours   integer,
  allow_member_discovery   boolean not null default true,
  allow_media_upload       boolean not null default true,

  -- Billetterie
  capacity                 integer,
  currency                 text not null default 'XOF',
  min_price                integer not null default 0,
  max_price                integer not null default 0,

  -- Annulation
  cancelled_at             timestamptz,
  cancellation_reason      text,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  constraint events_slug_format check (slug ~ '^[a-z0-9-]{3,80}$'),
  constraint events_dates_order check (end_at >= start_at),
  constraint events_capacity_positive check (capacity is null or capacity > 0),
  constraint events_open_before_range check (salon_open_before_hours between 0 and 8760),
  constraint events_open_after_range check (
    salon_open_after_hours is null or salon_open_after_hours between 0 and 8760
  )
);

comment on table public.events is 'Événement publié par une organisation.';
comment on column public.events.salon_privacy is 'Qui peut accéder au salon de l''événement.';
comment on column public.events.salon_open_before_hours is
  'Nombre d''heures avant le début où le salon devient accessible.';
comment on column public.events.min_price is
  'Prix le moins cher parmi les billets en vente (0 = gratuit).';

create index if not exists events_status_start_idx on public.events (status, start_at);
create index if not exists events_org_idx on public.events (organization_id, created_at desc);
create index if not exists events_category_idx on public.events (category);
create index if not exists events_city_idx on public.events (city);
create index if not exists events_tags_idx on public.events using gin (tags);
create index if not exists events_title_trgm_idx
  on public.events using gin (public.immutable_unaccent(title) gin_trgm_ops);
create index if not exists events_search_trgm_idx
  on public.events using gin (
    public.immutable_unaccent(
      title || ' ' || coalesce(summary, '') || ' ' || coalesce(venue_name, '')
    ) gin_trgm_ops
  );

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- L'utilisateur peut-il gérer cet événement ?
create or replace function public.can_manage_event(event_id uuid, user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events
    where events.id = can_manage_event.event_id
      and public.can_manage_org(events.organization_id, can_manage_event.user_id)
  );
$$;

comment on function public.can_manage_event(uuid, uuid) is
  'Vrai si l''utilisateur peut gérer l''événement (via son organisation ou en tant qu''admin).';

-- L'utilisateur est-il organisateur vérifié (rôle applicatif) ?
create or replace function public.has_role(required_role public.user_role, user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_roles.user_id = has_role.user_id
      and user_roles.role = required_role
  );
$$;

comment on function public.has_role(public.user_role, uuid) is
  'Vrai si l''utilisateur possède le rôle applicatif demandé.';