-- =============================================================================
--  0029 — RLS : notifications et préférences
-- =============================================================================

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

-- L'utilisateur peut marquer ses notifications comme lues.
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications
  for delete to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- notification_preferences
-- -----------------------------------------------------------------------------
alter table public.notification_preferences enable row level security;

drop policy if exists notification_preferences_own on public.notification_preferences;
create policy notification_preferences_own on public.notification_preferences
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Compteur de notifications non lues (badge de la barre de navigation)
-- -----------------------------------------------------------------------------
create or replace function public.unread_notification_count(target_user uuid default auth.uid())
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(count(*), 0)::integer
  from public.notifications
  where user_id = target_user
    and is_read = false;
$$;

comment on function public.unread_notification_count(uuid) is
  'Nombre de notifications non lues, pour le badge de navigation.';

-- -----------------------------------------------------------------------------
-- Notifications d'un utilisateur, avec l'acteur (auteur de l'action)
-- -----------------------------------------------------------------------------
create or replace view public.my_notifications
with (security_invoker = true)
as
select
  n.id,
  n.type,
  n.title,
  n.body,
  n.url,
  n.is_read,
  n.created_at,
  n.event_id,
  n.salon_id,
  n.post_id,
  n.conversation_id,
  n.actor_id,
  actor.display_name as actor_name,
  actor.avatar_url   as actor_avatar_url
from public.notifications n
left join public.profiles actor on actor.id = n.actor_id
where n.user_id = auth.uid()
order by n.created_at desc;

comment on view public.my_notifications is
  'Notifications de l''utilisateur connecté, enrichies du profil de l''acteur.';