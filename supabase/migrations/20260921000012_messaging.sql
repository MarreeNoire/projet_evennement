-- =============================================================================
--  0012 — Networking (2/2) : messagerie privée (cf. §15 du cahier)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- conversations
-- -----------------------------------------------------------------------------
create table if not exists public.conversations (
  id               uuid primary key default gen_random_uuid(),
  created_by       uuid references public.profiles (id) on delete set null,
  is_group         boolean not null default false,
  title            text,
  last_message_at  timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.conversations is
  'Conversation privée entre deux participants (groupes prévus en V2).';

create index if not exists conversations_last_message_idx
  on public.conversations (last_message_at desc);

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- conversation_participants
-- -----------------------------------------------------------------------------
create table if not exists public.conversation_participants (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  last_read_at     timestamptz not null default now(),
  is_archived      boolean not null default false,
  joined_at        timestamptz not null default now(),
  unique (conversation_id, user_id)
);

comment on table public.conversation_participants is 'Participants d''une conversation privée.';

create index if not exists conversation_participants_user_idx
  on public.conversation_participants (user_id, is_archived);
create index if not exists conversation_participants_conversation_idx
  on public.conversation_participants (conversation_id);

-- -----------------------------------------------------------------------------
-- messages
-- -----------------------------------------------------------------------------
create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  sender_id        uuid references public.profiles (id) on delete set null,
  content          text,
  attachments      jsonb not null default '[]'::jsonb,
  is_hidden        boolean not null default false,
  edited_at        timestamptz,
  created_at       timestamptz not null default now(),

  constraint messages_content_or_attachment check (
    (content is not null and char_length(trim(content)) > 0)
    or jsonb_array_length(attachments) > 0
  ),
  constraint messages_content_length check (content is null or char_length(content) <= 4000),
  constraint messages_attachments_array check (jsonb_typeof(attachments) = 'array')
);

comment on table public.messages is 'Message d''une conversation privée.';

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at desc);
create index if not exists messages_sender_idx on public.messages (sender_id, created_at desc);

-- -----------------------------------------------------------------------------
-- L'utilisateur participe-t-il à cette conversation ?
-- -----------------------------------------------------------------------------
create or replace function public.is_conversation_member(
  conversation_id uuid,
  user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = is_conversation_member.conversation_id
      and cp.user_id = is_conversation_member.user_id
  );
$$;

comment on function public.is_conversation_member(uuid, uuid) is
  'Vrai si l''utilisateur fait partie de la conversation.';