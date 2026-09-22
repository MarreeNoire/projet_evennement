-- =============================================================================
--  0005 — Billetterie (1/2) : types de billets et codes promotionnels
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ticket_types : catégories de billets d'un événement (cf. §10 du cahier)
-- -----------------------------------------------------------------------------
create table if not exists public.ticket_types (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events (id) on delete cascade,
  name           text not null,
  description    text,
  price          integer not null default 0,
  quantity       integer not null,
  sold_count     integer not null default 0,
  min_per_order  integer not null default 1,
  max_per_order  integer not null default 10,
  access_level   public.access_level not null default 'standard',
  benefits       text[] not null default '{}',
  sale_start     timestamptz,
  sale_end       timestamptz,
  is_active      boolean not null default true,
  covers_salon   boolean not null default true,
  position       integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint ticket_types_price_positive check (price >= 0),
  constraint ticket_types_quantity_positive check (quantity > 0),
  constraint ticket_types_sold_range check (sold_count >= 0 and sold_count <= quantity),
  constraint ticket_types_min_per_order check (min_per_order >= 1),
  constraint ticket_types_max_per_order check (max_per_order >= min_per_order),
  constraint ticket_types_sale_window check (
    sale_start is null or sale_end is null or sale_end > sale_start
  )
);

comment on table public.ticket_types is 'Type de billet proposé pour un événement.';
comment on column public.ticket_types.access_level is
  'Niveau d''accès débloqué : détermine l''accès au salon VIP notamment.';
comment on column public.ticket_types.sold_count is
  'Nombre de billets vendus, maintenu automatiquement par trigger.';

create index if not exists ticket_types_event_idx on public.ticket_types (event_id, position);
create index if not exists ticket_types_active_idx on public.ticket_types (event_id, is_active);

drop trigger if exists ticket_types_set_updated_at on public.ticket_types;
create trigger ticket_types_set_updated_at
  before update on public.ticket_types
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- promo_codes : réductions et accès spéciaux (cf. §30 du cahier)
-- -----------------------------------------------------------------------------
create table if not exists public.promo_codes (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations (id) on delete cascade,
  event_id           uuid references public.events (id) on delete cascade,
  code               citext not null,
  description        text,
  discount_kind      public.discount_kind not null default 'percentage',
  discount_value     integer not null,
  max_uses           integer,
  used_count         integer not null default 0,
  max_uses_per_user  integer not null default 1,
  min_order_amount   integer not null default 0,
  starts_at          timestamptz,
  expires_at         timestamptz,
  is_active          boolean not null default true,
  created_by         uuid references public.profiles (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint promo_codes_code_format check (code ~ '^[A-Z0-9_-]{3,30}$'),
  constraint promo_codes_discount_positive check (discount_value > 0),
  constraint promo_codes_percentage_max check (
    discount_kind <> 'percentage' or discount_value <= 100
  ),
  constraint promo_codes_uses_range check (max_uses is null or max_uses > 0),
  constraint promo_codes_used_range check (
    max_uses is null or used_count <= max_uses
  ),
  constraint promo_codes_window check (
    starts_at is null or expires_at is null or expires_at > starts_at
  ),
  unique (organization_id, code)
);

comment on table public.promo_codes is
  'Code promotionnel : réduction en pourcentage ou montant fixe, avec limites d''usage.';

create index if not exists promo_codes_org_idx on public.promo_codes (organization_id);
create index if not exists promo_codes_event_idx on public.promo_codes (event_id);
create index if not exists promo_codes_active_idx on public.promo_codes (code, is_active);

drop trigger if exists promo_codes_set_updated_at on public.promo_codes;
create trigger promo_codes_set_updated_at
  before update on public.promo_codes
  for each row execute function public.set_updated_at();