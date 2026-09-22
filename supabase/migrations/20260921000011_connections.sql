-- =============================================================================
--  0011 — Networking (1/2) : connexions et blocages (cf. §16 et §17)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- connections : mise en relation entre deux participants
-- -----------------------------------------------------------------------------
create table if not exists public.connections (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles (id) on delete cascade,
  addressee_id  uuid not null references public.profiles (id) on delete cascade,
  status        public.connection_status not null default 'pending',
  message       text,
  origin        text not null default 'profile',
  event_id      uuid references public.events (id) on delete set null,
  responded_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint connections_no_self check (requester_id <> addressee_id),
  constraint connections_origin check (origin in ('profile', 'badge_scan', 'suggestion', 'salon')),
  constraint connections_message_length check (message is null or char_length(message) <= 500)
);

comment on table public.connections is 'Demande de mise en relation entre deux participants.';
comment on column public.connections.origin is
  'badge_scan = créée par le scan du badge QR « J''ai rencontré cette personne ».';

create index if not exists connections_requester_idx on public.connections (requester_id, status);
create index if not exists connections_addressee_idx on public.connections (addressee_id, status);

-- Une seule relation par paire, quel que soit le sens de la demande.
create unique index if not exists connections_pair_key
  on public.connections (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

drop trigger if exists connections_set_updated_at on public.connections;
create trigger connections_set_updated_at
  before update on public.connections
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- blocks : un participant en bloque un autre (règle métier n°8)
-- -----------------------------------------------------------------------------
create table if not exists public.blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references public.profiles (id) on delete cascade,
  blocked_id  uuid not null references public.profiles (id) on delete cascade,
  reason      text,
  created_at  timestamptz not null default now(),

  constraint blocks_no_self check (blocker_id <> blocked_id),
  unique (blocker_id, blocked_id)
);

comment on table public.blocks is
  'Blocage d''un utilisateur : masque les contenus et empêche tout contact.';

create index if not exists blocks_blocker_idx on public.blocks (blocker_id);
create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

-- -----------------------------------------------------------------------------
-- Fonction : un blocage existe-t-il entre ces deux utilisateurs ?
-- -----------------------------------------------------------------------------
create or replace function public.is_blocked_between(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blocks b
    where (b.blocker_id = user_a and b.blocked_id = user_b)
       or (b.blocker_id = user_b and b.blocked_id = user_a)
  );
$$;

comment on function public.is_blocked_between(uuid, uuid) is
  'Vrai si un blocage existe dans un sens ou dans l''autre entre les deux utilisateurs.';