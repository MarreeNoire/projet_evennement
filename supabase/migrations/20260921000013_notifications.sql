-- =============================================================================
--  0013 — Notifications (cf. §26 du cahier)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- notifications : notification in-app, temps réel
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  type          public.notification_type not null,
  title         text not null,
  body          text,
  url           text,
  actor_id      uuid references public.profiles (id) on delete set null,
  event_id      uuid references public.events (id) on delete cascade,
  salon_id      uuid references public.salons (id) on delete cascade,
  post_id       uuid references public.posts (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete cascade,
  entity_type   text,
  entity_id     uuid,
  is_read       boolean not null default false,
  read_at       timestamptz,
  email_sent_at timestamptz,
  created_at    timestamptz not null default now(),

  constraint notifications_title_length check (char_length(title) between 1 and 160)
);

comment on table public.notifications is 'Notification destinée à un utilisateur (in-app).';
comment on column public.notifications.email_sent_at is
  'Renseigné lorsque la notification a été relayée par email.';

create index if not exists notifications_user_idx
  on public.notifications (user_id, is_read, created_at desc);
create index if not exists notifications_user_recent_idx
  on public.notifications (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- notification_preferences : préférences par type et par canal
-- -----------------------------------------------------------------------------
create table if not exists public.notification_preferences (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  type           public.notification_type not null,
  in_app         boolean not null default true,
  email          boolean not null default false,
  push           boolean not null default false,
  updated_at     timestamptz not null default now(),
  unique (user_id, type)
);

comment on table public.notification_preferences is
  'Préférences de notification par type afin d''éviter la surcharge (cf. §26).';

create index if not exists notification_preferences_user_idx
  on public.notification_preferences (user_id);

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- Valeurs par défaut : tout en in-app, emails uniquement pour l'essentiel.
create or replace function public.seed_notification_preferences(target_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_type_value public.notification_type;
  email_default boolean;
begin
  foreach notification_type_value in array enum_range(null::public.notification_type)
  loop
    email_default := notification_type_value in (
      'ticket_confirmed'::public.notification_type,
      'event_reminder'::public.notification_type,
      'event_update'::public.notification_type,
      'organizer_announcement'::public.notification_type,
      'connection_request'::public.notification_type
    );

    insert into public.notification_preferences (user_id, type, in_app, email)
    values (target_user, notification_type_value, true, email_default)
    on conflict (user_id, type) do nothing;
  end loop;
end;
$$;

comment on function public.seed_notification_preferences(uuid) is
  'Crée les préférences de notification par défaut pour un nouvel utilisateur.';