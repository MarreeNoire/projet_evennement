-- =============================================================================
--  0030 — RLS : messagerie privée
-- =============================================================================

-- -----------------------------------------------------------------------------
-- conversations
-- -----------------------------------------------------------------------------
alter table public.conversations enable row level security;

drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations
  for select to authenticated
  using (public.is_conversation_member(id));

drop policy if exists conversations_insert_self on public.conversations;
create policy conversations_insert_self on public.conversations
  for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists conversations_update_members on public.conversations;
create policy conversations_update_members on public.conversations
  for update to authenticated
  using (public.is_conversation_member(id))
  with check (public.is_conversation_member(id));

drop policy if exists conversations_delete_members on public.conversations;
create policy conversations_delete_members on public.conversations
  for delete to authenticated
  using (public.is_conversation_member(id));

-- -----------------------------------------------------------------------------
-- conversation_participants
-- -----------------------------------------------------------------------------
alter table public.conversation_participants enable row level security;

drop policy if exists conversation_participants_select on public.conversation_participants;
create policy conversation_participants_select on public.conversation_participants
  for select to authenticated
  using (public.is_conversation_member(conversation_id));

drop policy if exists conversation_participants_insert on public.conversation_participants;
create policy conversation_participants_insert on public.conversation_participants
  for insert to authenticated
  with check (
    user_id = auth.uid()
    or public.is_conversation_member(conversation_id)
  );

drop policy if exists conversation_participants_update_own on public.conversation_participants;
create policy conversation_participants_update_own on public.conversation_participants
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists conversation_participants_delete_own on public.conversation_participants;
create policy conversation_participants_delete_own on public.conversation_participants
  for delete to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- messages
-- -----------------------------------------------------------------------------
alter table public.messages enable row level security;

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select to authenticated
  using (
    public.is_conversation_member(conversation_id)
    and (messages.is_hidden = false or sender_id = auth.uid())
  );

-- On ne peut écrire que si l'on participe à la conversation et qu'aucun
-- blocage n'existe avec l'autre participant (cf. §15 du cahier).
drop policy if exists messages_insert_members on public.messages;
create policy messages_insert_members on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_conversation_member(conversation_id)
    and not exists (
      select 1
      from public.conversation_participants cp
      join public.blocks b
        on (b.blocker_id = cp.user_id and b.blocked_id = auth.uid())
        or (b.blocker_id = auth.uid() and b.blocked_id = cp.user_id)
      where cp.conversation_id = messages.conversation_id
        and cp.user_id <> auth.uid()
    )
  );

drop policy if exists messages_update_own on public.messages;
create policy messages_update_own on public.messages
  for update to authenticated
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

drop policy if exists messages_delete_own on public.messages;
create policy messages_delete_own on public.messages
  for delete to authenticated
  using (sender_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Vue : messagerie de l'utilisateur (dernier message + interlocuteur)
-- -----------------------------------------------------------------------------
create or replace view public.my_conversations
with (security_invoker = true)
as
select
  c.id                as conversation_id,
  c.last_message_at,
  peer.user_id        as peer_id,
  peer_profile.display_name as peer_name,
  peer_profile.avatar_url   as peer_avatar_url,
  last_message.content      as last_message_content,
  last_message.created_at   as last_message_created_at,
  last_message.sender_id    as last_message_sender_id
from public.conversations c
join public.conversation_participants mine
  on mine.conversation_id = c.id and mine.user_id = auth.uid()
left join public.conversation_participants peer
  on peer.conversation_id = c.id and peer.user_id <> auth.uid()
left join public.profiles peer_profile on peer_profile.id = peer.user_id
left join lateral (
  select m.content, m.created_at, m.sender_id
  from public.messages m
  where m.conversation_id = c.id and m.is_hidden = false
  order by m.created_at desc
  limit 1
) last_message on true
where mine.is_archived = false
order by c.last_message_at desc;

comment on view public.my_conversations is
  'Conversations de l''utilisateur connecté avec aperçu du dernier message.';