-- =============================================================================
--  0002 — Identité (1/2) : profils, rôles et organisations
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles : prolongement applicatif de auth.users
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                      uuid primary key references auth.users (id) on delete cascade,
  username                citext unique,
  display_name            text not null default 'Nouveau membre',
  full_name               text,
  email                   citext,
  phone                   text,
  avatar_url              text,
  bio                     text,
  city                    text default 'Abidjan',
  country                 text default 'Côte d''Ivoire',
  interests               text[] not null default '{}',
  visibility              public.visibility_level not null default 'members',
  allow_search            boolean not null default true,
  allow_connections       boolean not null default true,
  allow_private_messages  boolean not null default true,
  is_verified             boolean not null default false,
  onboarding_completed    boolean not null default false,
  last_seen_at            timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint profiles_username_format check (
    username is null or username ~ '^[a-z0-9._]{3,30}$'
  ),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 500)
);

comment on table public.profiles is 'Profil public et préférences de visibilité d''un utilisateur.';
comment on column public.profiles.visibility is 'Qui peut trouver ce profil dans la recherche.';
comment on column public.profiles.interests is 'Centres d''intérêt utilisés pour les recommandations.';

create index if not exists profiles_username_idx on public.profiles (username);
create index if not exists profiles_display_name_trgm_idx
  on public.profiles using gin (public.immutable_unaccent(display_name) gin_trgm_ops);
create index if not exists profiles_interests_idx on public.profiles using gin (interests);
create index if not exists profiles_visibility_idx on public.profiles (visibility, allow_search);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- user_roles : RBAC applicatif (un utilisateur peut cumuler plusieurs rôles)
-- -----------------------------------------------------------------------------
create table if not exists public.user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        public.user_role not null,
  granted_by  uuid references public.profiles (id) on delete set null,
  granted_at  timestamptz not null default now(),
  unique (user_id, role)
);

comment on table public.user_roles is 'Rôles applicatifs : participant, organizer, admin.';

create index if not exists user_roles_user_idx on public.user_roles (user_id);
create index if not exists user_roles_role_idx on public.user_roles (role);

-- -----------------------------------------------------------------------------
-- organizations : entité organisatrice (entreprise, association, collectif)
-- -----------------------------------------------------------------------------
create table if not exists public.organizations (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (id) on delete restrict,
  name         text not null,
  slug         citext not null unique,
  description  text,
  logo_url     text,
  cover_url    text,
  website      text,
  email        citext,
  phone        text,
  city         text,
  country      text default 'Côte d''Ivoire',
  is_verified  boolean not null default false,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint organizations_slug_format check (slug ~ '^[a-z0-9-]{3,60}$')
);

comment on table public.organizations is 'Organisateur d''événements : structure et équipe.';

create index if not exists organizations_owner_idx on public.organizations (owner_id);
create index if not exists organizations_active_idx on public.organizations (is_active);

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- organization_members : équipe d'un organisateur (co-organisateurs, agents…)
-- -----------------------------------------------------------------------------
create table if not exists public.organization_members (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  user_id          uuid references public.profiles (id) on delete cascade,
  invited_email    citext,
  role             public.org_role not null default 'manager',
  status           text not null default 'active',
  invited_by       uuid references public.profiles (id) on delete set null,
  joined_at        timestamptz not null default now(),

  constraint organization_members_identity check (user_id is not null or invited_email is not null),
  constraint organization_members_status check (status in ('invited', 'active', 'suspended')),
  unique (organization_id, user_id)
);

comment on table public.organization_members is 'Membres d''une organisation et leurs permissions.';

create index if not exists organization_members_org_idx
  on public.organization_members (organization_id);
create index if not exists organization_members_user_idx
  on public.organization_members (user_id);

-- -----------------------------------------------------------------------------
-- Fonctions d'autorisation (utilisées par les politiques RLS)
-- -----------------------------------------------------------------------------

-- L'utilisateur est-il administrateur de la plateforme ?
create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_roles.user_id = is_admin.user_id
      and user_roles.role = 'admin'
  );
$$;

comment on function public.is_admin(uuid) is
  'Vrai si l''utilisateur est administrateur de la plateforme.';

-- L'utilisateur est-il membre actif de cette organisation ?
create or replace function public.is_org_member(org_id uuid, user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_members.organization_id = is_org_member.org_id
      and organization_members.user_id = is_org_member.user_id
      and organization_members.status = 'active'
  );
$$;

comment on function public.is_org_member(uuid, uuid) is
  'Vrai si l''utilisateur est membre actif de l''organisation.';

-- L'utilisateur peut-il administrer cette organisation ?
create or replace function public.can_manage_org(org_id uuid, user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin(user_id)
      or exists (
        select 1
        from public.organizations
        where organizations.id = can_manage_org.org_id
          and organizations.owner_id = can_manage_org.user_id
      )
      or exists (
        select 1
        from public.organization_members
        where organization_members.organization_id = can_manage_org.org_id
          and organization_members.user_id = can_manage_org.user_id
          and organization_members.status = 'active'
          and organization_members.role in ('owner', 'manager')
      );
$$;

comment on function public.can_manage_org(uuid, uuid) is
  'Vrai si l''utilisateur peut administrer l''organisation (admin, propriétaire ou gestionnaire).';