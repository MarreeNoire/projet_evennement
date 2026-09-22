-- =============================================================================
--  0006 — Billetterie (2/2) : commandes, lignes de commande et paiements
-- =============================================================================

-- -----------------------------------------------------------------------------
-- orders : commande d'un utilisateur pour un événement
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  reference         citext not null unique,
  user_id           uuid not null references public.profiles (id) on delete restrict,
  event_id          uuid not null references public.events (id) on delete restrict,
  organization_id   uuid not null references public.organizations (id) on delete restrict,
  status            public.order_status not null default 'pending',

  subtotal          integer not null default 0,
  discount          integer not null default 0,
  fees              integer not null default 0,
  total             integer not null default 0,
  commission        integer not null default 0,
  currency          text not null default 'XOF',

  promo_code_id     uuid references public.promo_codes (id) on delete set null,
  buyer_name        text,
  buyer_email       citext,
  buyer_phone       text,

  paid_at           timestamptz,
  cancelled_at      timestamptz,
  refunded_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint orders_amounts_positive check (
    subtotal >= 0 and discount >= 0 and fees >= 0 and total >= 0 and commission >= 0
  ),
  constraint orders_total_consistent check (total = subtotal - discount + fees)
);

comment on table public.orders is 'Commande groupant un ou plusieurs billets pour un événement.';
comment on column public.orders.commission is 'Commission plateforme calculée à la confirmation du paiement.';

create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_event_idx on public.orders (event_id, status);
create index if not exists orders_org_idx on public.orders (organization_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- order_items : détail des quantités par type de billet
-- -----------------------------------------------------------------------------
create table if not exists public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  ticket_type_id  uuid not null references public.ticket_types (id) on delete restrict,
  quantity        integer not null,
  unit_price      integer not null default 0,
  line_total      integer not null default 0,
  created_at      timestamptz not null default now(),

  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_unit_price_positive check (unit_price >= 0),
  constraint order_items_line_total check (line_total = quantity * unit_price)
);

comment on table public.order_items is 'Ligne de commande : quantité et prix figé par type de billet.';

create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_ticket_type_idx on public.order_items (ticket_type_id);

-- -----------------------------------------------------------------------------
-- payments : transactions auprès du prestataire (CinetPay)
-- -----------------------------------------------------------------------------
create table if not exists public.payments (
  id                       uuid primary key default gen_random_uuid(),
  order_id                 uuid not null references public.orders (id) on delete cascade,
  provider                 text not null default 'cinetpay',
  provider_transaction_id  text not null,
  provider_payment_token   text,
  provider_payment_url     text,
  amount                   integer not null,
  currency                 text not null default 'XOF',
  status                   public.payment_status not null default 'initiated',
  method                   text,
  channel                  text,
  payer_phone              text,
  payload                  jsonb not null default '{}'::jsonb,
  error_message            text,
  initiated_at             timestamptz not null default now(),
  completed_at             timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  constraint payments_amount_positive check (amount >= 0),
  constraint payments_payload_object check (jsonb_typeof(payload) = 'object'),
  unique (provider, provider_transaction_id)
);

comment on table public.payments is 'Transaction de paiement, journalisée (règle métier n°12).';
comment on column public.payments.payload is
  'Charge utile brute du prestataire, conservée pour audit et résolution de litiges.';

create index if not exists payments_order_idx on public.payments (order_id);
create index if not exists payments_status_idx on public.payments (status, created_at desc);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();