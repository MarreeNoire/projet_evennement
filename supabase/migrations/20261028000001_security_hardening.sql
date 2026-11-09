-- =============================================================================
--  Durcissement de la sécurité — audit du 8 novembre 2026
-- -----------------------------------------------------------------------------
--  Correctifs :
--    1. orders / order_items / payments : écriture réservée au serveur
--       (service_role). Un client ne peut plus modifier le montant d'une
--       commande ni s'auto-confirmer après paiement.
--    2. tickets : plus aucune écriture directe depuis le navigateur
--       (niveau d'accès, prix payé, jeton QR figés après émission).
--    3. organization_members : un membre ne peut plus changer son propre rôle.
--    4. generate_tickets_for_order : exécution réservée au service_role.
--    5. search_team_invite_profiles : plus de recherche sur l'adresse e-mail.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Commandes : écriture serveur uniquement
-- -----------------------------------------------------------------------------
revoke insert, update, delete on public.orders from public, anon, authenticated;

drop policy if exists orders_insert_self on public.orders;
drop policy if exists orders_update_owner_pending on public.orders;

-- Garde-fou : même si un GRANT était rétabli par erreur (console Supabase,
-- script), aucune écriture authentifiée ne peut toucher une commande.
create or replace function public.guard_order_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.role() = 'service_role' then
    return new;
  end if;
  raise exception 'Écriture directe sur les commandes interdite.'
    using errcode = '42501';
end;
$$;

drop trigger if exists orders_guard_write on public.orders;
create trigger orders_guard_write
  before insert or update on public.orders
  for each row execute function public.guard_order_write();

comment on function public.guard_order_write() is
  'Refuse toute écriture authentifiée sur orders : les commandes passent par le serveur.';

-- Lignes de commande et paiements : créés côté serveur avec le client admin.
revoke insert, update, delete on public.order_items from public, anon, authenticated;
drop policy if exists order_items_insert_self on public.order_items;

revoke insert, update, delete on public.payments from public, anon, authenticated;
drop policy if exists payments_insert_self on public.payments;

-- -----------------------------------------------------------------------------
-- 2. Billets : émission figée (seul le serveur ou perform_check_in écrit)
-- -----------------------------------------------------------------------------
revoke update on public.tickets from public, anon, authenticated;
drop policy if exists tickets_update_holder on public.tickets;

comment on table public.tickets is
  'Billets émis par le serveur. Aucune colonne n''est modifiable depuis le client (access_level, price_paid et qr_token sont figés).';

-- -----------------------------------------------------------------------------
-- 3. Membres d'organisation : le rôle ne s'auto-attribue pas
-- -----------------------------------------------------------------------------
create or replace function public.guard_organization_member_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Écriture système (migrations, service_role) : autorisée.
  if auth.uid() is null then
    return new;
  end if;

  -- Propriétaire ou gestionnaire de l'organisation : autorisé.
  if public.can_manage_org(old.organization_id) then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.organization_id is distinct from old.organization_id
     or new.user_id is distinct from old.user_id then
    raise exception 'Seul un gestionnaire de l''organisation peut modifier ce rôle.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists organization_members_guard_role on public.organization_members;
create trigger organization_members_guard_role
  before update on public.organization_members
  for each row execute function public.guard_organization_member_update();

comment on function public.guard_organization_member_update() is
  'Empêche un membre de s''attribuer un rôle supérieur dans son organisation.';

-- -----------------------------------------------------------------------------
-- 4. Génération des billets : réservée au serveur
-- -----------------------------------------------------------------------------
revoke all on function public.generate_tickets_for_order(uuid) from public, anon, authenticated;
grant execute on function public.generate_tickets_for_order(uuid) to service_role;

-- -----------------------------------------------------------------------------
-- 5. Recherche de profils pour l'équipe : plus d'oracle sur l'e-mail
-- -----------------------------------------------------------------------------
create or replace function public.search_team_invite_profiles(
  search_query text,
  organization_id uuid,
  result_limit integer default 10
)
returns table (
  id uuid,
  display_name text,
  username text,
  full_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.display_name, p.username, p.full_name, p.avatar_url
  from public.profiles p
  where auth.uid() is not null
    and p.id <> auth.uid()
    and p.allow_search = true
    and nullif(btrim(search_query), '') is not null
    and char_length(btrim(search_query)) >= 2
    and (
      exists (
        select 1 from public.organizations o
        where o.id = organization_id and o.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.organization_members m
        where m.organization_id = organization_id
          and m.user_id = auth.uid()
          and m.status = 'active'
          and m.role in ('owner', 'manager')
      )
    )
    and (
      p.display_name ilike '%' || replace(replace(search_query, '%', ''), '_', '') || '%'
      or p.full_name ilike '%' || replace(replace(search_query, '%', ''), '_', '') || '%'
      or p.username ilike '%' || ltrim(replace(replace(search_query, '%', ''), '_', ''), '@') || '%'
    )
  order by p.display_name nulls last, p.username nulls last
  limit least(greatest(coalesce(result_limit, 10), 1), 20);
$$;

revoke all on function public.search_team_invite_profiles(text, uuid, integer) from public, anon;
grant execute on function public.search_team_invite_profiles(text, uuid, integer) to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Profils : le badge « vérifié » reste réservé à l'administration
-- -----------------------------------------------------------------------------
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Écriture système / administration : autorisée.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.is_verified is distinct from old.is_verified then
    raise exception 'Le statut vérifié est attribué par l''administration.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_verified on public.profiles;
create trigger profiles_guard_verified
  before update on public.profiles
  for each row execute function public.guard_profile_update();

comment on function public.guard_profile_update() is
  'Empêche un utilisateur de s''attribuer le badge vérifié.';

-- -----------------------------------------------------------------------------
-- 7. Salons : le rôle de membre ne s'auto-attribue pas
-- -----------------------------------------------------------------------------
create or replace function public.guard_salon_member_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.can_moderate_salon(old.salon_id) then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.salon_id is distinct from old.salon_id
     or new.user_id is distinct from old.user_id then
    raise exception 'Seul un modérateur du salon peut modifier ce rôle.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists salon_members_guard_role on public.salon_members;
create trigger salon_members_guard_role
  before update on public.salon_members
  for each row execute function public.guard_salon_member_update();

commit;
