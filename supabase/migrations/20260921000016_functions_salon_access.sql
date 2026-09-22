-- =============================================================================
--  0016 — Fonctions : accès et modération d'un salon
--  (cf. §71 du cahier, règles métier 1 à 6)
-- =============================================================================

-- L'utilisateur peut-il entrer dans ce salon ?
--  admin
--  OU membre inscrit au salon
--  OU salon public sans billet requis
--  OU billet valide pour l'événement ET niveau d'accès suffisant (salons VIP)
--  OU membre de l'organisation propriétaire
create or replace function public.can_access_salon(salon_id uuid, user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select
        public.is_admin(can_access_salon.user_id)
        or exists (
          select 1
          from public.salon_members sm
          where sm.salon_id = can_access_salon.salon_id
            and sm.user_id = can_access_salon.user_id
            and sm.left_at is null
        )
        or (salons.privacy = 'public' and salons.require_ticket = false)
        or (
          salons.require_ticket
          and salons.event_id is not null
          and public.has_valid_ticket(salons.event_id, can_access_salon.user_id)
          and (
            salons.access_level = 'standard'
            or public.highest_access_level(salons.event_id, can_access_salon.user_id)
               in ('vip', 'vvip')
          )
        )
        or (
          salons.organization_id is not null
          and public.is_org_member(salons.organization_id, can_access_salon.user_id)
        )
      from public.salons
      where salons.id = can_access_salon.salon_id
    ),
    false
  );
$$;

comment on function public.can_access_salon(uuid, uuid) is
  'Vrai si l''utilisateur a le droit d''entrer dans le salon.';

-- L'utilisateur peut-il modérer ce salon ?
create or replace function public.can_moderate_salon(salon_id uuid, user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin(can_moderate_salon.user_id)
      or exists (
        select 1
        from public.salon_members sm
        where sm.salon_id = can_moderate_salon.salon_id
          and sm.user_id = can_moderate_salon.user_id
          and sm.left_at is null
          and sm.role in ('owner', 'moderator')
      )
      or exists (
        select 1
        from public.salons s
        where s.id = can_moderate_salon.salon_id
          and s.organization_id is not null
          and public.can_manage_org(s.organization_id, can_moderate_salon.user_id)
      );
$$;

comment on function public.can_moderate_salon(uuid, uuid) is
  'Vrai si l''utilisateur peut modérer le salon (propriétaire, modérateur, admin ou gestionnaire).';