-- =============================================================================
--  Correctifs de sécurité — audit du 9 novembre 2026
-- -----------------------------------------------------------------------------
--  Ce fichier corrige les constats encore ouverts après le durcissement du
--  28 octobre :
--    1. salon_members : interdiction de s'auto-attribuer owner/moderator ;
--    2. connections : une demande insérée doit être en attente ;
--    3. profils : email retiré de la lecture client et des mises à jour client ;
--    4. organization_members : plus de fuite des emails d'invitation ;
--    5. posts : colonnes de modération figées pour les auteurs ;
--    6. ensure_event_salon / log_audit : contrôle d'autorisation ;
--    7. messagerie : plus d'ajout arbitraire de participants ;
--    8. demandes de téléphone : insertion forcée en attente.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Salon : le rôle ne s'auto-attribue pas à l'insertion
-- -----------------------------------------------------------------------------
create or replace function public.guard_salon_member_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Écriture système (migrations, service_role, triggers) : autorisée.
  if auth.uid() is null then
    return new;
  end if;

  -- Un modérateur existant peut ajouter les membres qu'il souhaite.
  if public.can_moderate_salon(new.salon_id) then
    return new;
  end if;

  -- Auto-adhésion uniquement avec le rôle non privilégié.
  if new.user_id <> auth.uid() or new.role <> 'manager' then
    raise exception 'Rôle de salon non autorisé.' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists salon_members_guard_insert on public.salon_members;
create trigger salon_members_guard_insert
  before insert on public.salon_members
  for each row execute function public.guard_salon_member_insert();

-- Défense en profondeur : même si le trigger était retiré, la policy refuse
-- explicitement les rôles privilégiés en auto-adhésion.
drop policy if exists salon_members_join_self on public.salon_members;
create policy salon_members_join_self on public.salon_members
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.can_access_salon(salon_id)
    and role = 'manager'
  );

comment on function public.guard_salon_member_insert() is
  'Empêche un utilisateur de s''attribuer owner/moderator en rejoignant un salon.';

-- -----------------------------------------------------------------------------
-- 2. Connexions : une insertion est toujours une demande en attente
-- -----------------------------------------------------------------------------
drop policy if exists connections_insert_self on public.connections;
create policy connections_insert_self on public.connections
  for insert to authenticated
  with check (
    requester_id = auth.uid()
    and requester_id <> addressee_id
    and status = 'pending'
    and responded_at is null
    and not public.is_blocked_between(requester_id, addressee_id)
    and private.profile_accepts_connections(addressee_id)
  );

create or replace function public.guard_connection_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.requester_id <> auth.uid()
     or new.status <> 'pending'
     or new.responded_at is not null then
    raise exception 'Une demande de connexion doit être en attente.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists connections_guard_insert on public.connections;
create trigger connections_guard_insert
  before insert on public.connections
  for each row execute function public.guard_connection_insert();

comment on function public.guard_connection_insert() is
  'Refuse la création d''une connexion déjà acceptée ou répondue.';

-- -----------------------------------------------------------------------------
-- 3. Profils : l'email redevient une donnée strictement privée
-- -----------------------------------------------------------------------------
revoke select (email) on public.profiles from anon, authenticated;
revoke update (email) on public.profiles from anon, authenticated;

-- Le badge vérifié ne peut pas non plus être auto-attribué à l'insertion.
create or replace function public.guard_profile_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and new.is_verified then
    raise exception 'Le statut vérifié est attribué par l''administration.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_insert on public.profiles;
create trigger profiles_guard_insert
  before insert on public.profiles
  for each row execute function public.guard_profile_insert();

-- -----------------------------------------------------------------------------
-- 4. Organisation : plus de fuite des emails d'invitation
-- -----------------------------------------------------------------------------
drop policy if exists organization_members_select on public.organization_members;
create policy organization_members_select on public.organization_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.can_manage_org(organization_id)
    or (
      invited_email is not null
      and invited_email = ((select auth.jwt()) ->> 'email')::citext
    )
  );

-- -----------------------------------------------------------------------------
-- 5. Publications : les colonnes de modération restent réservées aux modérateurs
-- -----------------------------------------------------------------------------
create or replace function public.guard_post_author_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.can_moderate_salon(old.salon_id) then
    return new;
  end if;

  if new.author_id is distinct from old.author_id
     or new.salon_id is distinct from old.salon_id
     or new.kind is distinct from old.kind
     or new.is_pinned is distinct from old.is_pinned
     or new.is_hidden is distinct from old.is_hidden
     or new.hidden_by is distinct from old.hidden_by
     or new.hidden_reason is distinct from old.hidden_reason
     or new.reaction_count is distinct from old.reaction_count
     or new.comment_count is distinct from old.comment_count
     or new.mentions is distinct from old.mentions then
    raise exception 'Colonne réservée à la modération du salon.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists posts_guard_author_update on public.posts;
create trigger posts_guard_author_update
  before update on public.posts
  for each row execute function public.guard_post_author_update();

comment on function public.guard_post_author_update() is
  'Un auteur ne peut pas épingler, masquer ou transformer sa publication en annonce.';

-- -----------------------------------------------------------------------------
-- 6. Fonctions sensibles : contrôle d'autorisation explicite
-- -----------------------------------------------------------------------------
create or replace function public.ensure_event_salon(target_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  event_row public.events;
  existing_salon_id uuid;
  new_salon_id uuid;
begin
  if auth.uid() is not null and not public.can_manage_event(target_event_id) then
    raise exception 'Événement non autorisé.' using errcode = '42501';
  end if;

  select * into event_row from public.events where id = target_event_id;

  if event_row is null then
    raise exception 'Événement % introuvable', target_event_id;
  end if;

  select s.id into existing_salon_id
  from public.salons s
  where s.event_id = target_event_id
    and s.is_recurring = false
  limit 1;

  if existing_salon_id is not null then
    return existing_salon_id;
  end if;

  insert into public.salons (
    event_id, organization_id, name, slug, description, cover_url,
    privacy, access_level, require_ticket, auto_join
  )
  values (
    event_row.id,
    event_row.organization_id,
    event_row.title,
    'salon-' || event_row.slug,
    'Salon communautaire de l''événement « ' || event_row.title || ' ».',
    event_row.cover_url,
    event_row.salon_privacy,
    'standard',
    true,
    true
  )
  returning id into new_salon_id;

  insert into public.salon_members (salon_id, user_id, role)
  select new_salon_id, o.owner_id, 'owner'
  from public.organizations o
  where o.id = event_row.organization_id
  on conflict (salon_id, user_id) do update
    set role = 'owner', left_at = null;

  insert into public.salon_members (salon_id, user_id, role)
  select new_salon_id, om.user_id, 'moderator'
  from public.organization_members om
  where om.organization_id = event_row.organization_id
    and om.user_id is not null
    and om.status = 'active'
  on conflict (salon_id, user_id) do nothing;

  return new_salon_id;
end;
$$;

revoke all on function public.ensure_event_salon(uuid) from public, anon;
grant execute on function public.ensure_event_salon(uuid) to authenticated, service_role;

create or replace function public.log_audit(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_organization_id uuid default null,
  p_event_id uuid default null,
  p_before jsonb default null,
  p_after jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Journal d''audit réservé à l''administration.'
      using errcode = '42501';
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id,
    organization_id, event_id, before, after
  )
  values (
    auth.uid(), p_action, p_entity_type, p_entity_id,
    p_organization_id, p_event_id, p_before, p_after
  );
end;
$$;

revoke all on function public.log_audit(text, text, uuid, uuid, uuid, jsonb, jsonb)
  from public, anon;
grant execute on function public.log_audit(text, text, uuid, uuid, uuid, jsonb, jsonb)
  to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 7. Messagerie : seules les relations consenties peuvent être ajoutées
-- -----------------------------------------------------------------------------
drop policy if exists conversation_participants_insert on public.conversation_participants;
create policy conversation_participants_insert on public.conversation_participants
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and c.created_by = auth.uid()
    )
    and (
      user_id = auth.uid()
      or exists (
        select 1
        from public.connections cnn
        where cnn.status = 'accepted'
          and (
            (cnn.requester_id = auth.uid() and cnn.addressee_id = user_id)
            or (cnn.addressee_id = auth.uid() and cnn.requester_id = user_id)
          )
      )
    )
  );

drop policy if exists conversations_delete_members on public.conversations;
create policy conversations_delete_members on public.conversations
  for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- 8. Demandes de téléphone : insertion en attente uniquement
-- -----------------------------------------------------------------------------
drop policy if exists connection_contact_requests_insert_requester on public.connection_contact_requests;
create policy connection_contact_requests_insert_requester on public.connection_contact_requests
  for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and status = 'pending'
    and responded_at is null
    and exists (
      select 1
      from public.connections c
      where c.id = connection_id
        and c.status = 'accepted'
        and (
          (c.requester_id = (select auth.uid()) and c.addressee_id = recipient_id)
          or (c.addressee_id = (select auth.uid()) and c.requester_id = recipient_id)
        )
    )
  );

commit;
