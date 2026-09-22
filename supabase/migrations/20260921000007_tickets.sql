-- =============================================================================
--  0007 — Billets numériques et contrôle d'accès
-- =============================================================================

-- -----------------------------------------------------------------------------
-- tickets : billet unitaire avec QR code unique (cf. §11 du cahier)
-- -----------------------------------------------------------------------------
create table if not exists public.tickets (
  id               uuid primary key default gen_random_uuid(),
  reference        citext not null unique,
  qr_token         uuid not null unique default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  order_item_id    uuid references public.order_items (id) on delete set null,
  event_id         uuid not null references public.events (id) on delete restrict,
  user_id          uuid not null references public.profiles (id) on delete restrict,
  ticket_type_id   uuid not null references public.ticket_types (id) on delete restrict,
  status           public.ticket_status not null default 'pending',
  access_level     public.access_level not null default 'standard',
  holder_name      text,
  holder_email     citext,
  price_paid       integer not null default 0,

  checked_in_at    timestamptz,
  checked_in_by    uuid references public.profiles (id) on delete set null,

  cancelled_at     timestamptz,
  refunded_at      timestamptz,
  expires_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint tickets_price_positive check (price_paid >= 0)
);

comment on table public.tickets is 'Billet numérique nominatif, porteur du QR code d''entrée.';
comment on column public.tickets.qr_token is
  'Jeton opaque encodé dans le QR code. Aucune donnée personnelle n''y figure.';
comment on column public.tickets.status is
  'pending → paid → used, ou cancelled / refunded / expired.';

-- Un participant ne peut détenir qu'un billet par type d'accès s'il est déjà VIP,
-- mais peut acheter plusieurs billets pour des invités : on indexe sans unicités.
create index if not exists tickets_user_idx on public.tickets (user_id, created_at desc);
create index if not exists tickets_event_idx on public.tickets (event_id, status);
create index if not exists tickets_order_idx on public.tickets (order_id);
create index if not exists tickets_type_idx on public.tickets (ticket_type_id);
create index if not exists tickets_qr_idx on public.tickets (qr_token);
create index if not exists tickets_event_status_idx on public.tickets (event_id, access_level);

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- check_ins : journal des contrôles d'accès (règle métier n°13)
-- -----------------------------------------------------------------------------
create table if not exists public.check_ins (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid references public.tickets (id) on delete set null,
  event_id     uuid not null references public.events (id) on delete cascade,
  scanned_by   uuid references public.profiles (id) on delete set null,
  result       public.checkin_result not null,
  scanned_code text,
  note         text,
  device       text,
  created_at   timestamptz not null default now()
);

comment on table public.check_ins is
  'Historique de tous les scans (valides ou non) pour audit et statistiques.';

create index if not exists check_ins_event_idx on public.check_ins (event_id, created_at desc);
create index if not exists check_ins_ticket_idx on public.check_ins (ticket_id);
create index if not exists check_ins_result_idx on public.check_ins (event_id, result);

-- -----------------------------------------------------------------------------
-- L'utilisateur a-t-il un billet valide pour cet événement ?
-- Utilisé par les politiques RLS pour l'accès aux salons.
-- -----------------------------------------------------------------------------
create or replace function public.has_valid_ticket(event_id uuid, user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tickets t
    where t.event_id = has_valid_ticket.event_id
      and t.user_id = has_valid_ticket.user_id
      and t.status in ('paid', 'used')
  );
$$;

comment on function public.has_valid_ticket(uuid, uuid) is
  'Vrai si l''utilisateur détient un billet payé (ou déjà scanné) pour l''événement.';

-- Renvoie le niveau d'accès le plus élevé détenu par l'utilisateur sur un événement.
create or replace function public.highest_access_level(event_id uuid, user_id uuid default auth.uid())
returns public.access_level
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select t.access_level
      from public.tickets t
      where t.event_id = highest_access_level.event_id
        and t.user_id = highest_access_level.user_id
        and t.status in ('paid', 'used')
      order by
        case t.access_level
          when 'vvip' then 3
          when 'vip' then 2
          else 1
        end desc
      limit 1
    ),
    'standard'::public.access_level
  );
$$;

comment on function public.highest_access_level(uuid, uuid) is
  'Niveau d''accès le plus élevé détenu par l''utilisateur sur l''événement.';