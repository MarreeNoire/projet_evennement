-- =============================================================================
--  0025 — RLS : salons et appartenance aux salons
-- =============================================================================

-- -----------------------------------------------------------------------------
-- salons
-- -----------------------------------------------------------------------------
alter table public.salons enable row level security;

drop policy if exists salons_select on public.salons;
create policy salons_select on public.salons
  for select to authenticated
  using (
    public.can_access_salon(id)
    or (
      organization_id is not null
      and public.can_manage_org(organization_id)
    )
  );

drop policy if exists salons_insert_managers on public.salons;
create policy salons_insert_managers on public.salons
  for insert to authenticated
  with check (
    organization_id is not null
    and public.can_manage_org(organization_id)
  );

drop policy if exists salons_update_managers on public.salons;
create policy salons_update_managers on public.salons
  for update to authenticated
  using (
    public.can_moderate_salon(id)
    or (
      organization_id is not null
      and public.can_manage_org(organization_id)
    )
  )
  with check (
    public.can_moderate_salon(id)
    or (
      organization_id is not null
      and public.can_manage_org(organization_id)
    )
  );

drop policy if exists salons_delete_managers on public.salons;
create policy salons_delete_managers on public.salons
  for delete to authenticated
  using (
    public.is_admin()
    or (
      organization_id is not null
      and public.can_manage_org(organization_id)
    )
  );

-- -----------------------------------------------------------------------------
-- salon_members
-- -----------------------------------------------------------------------------
alter table public.salon_members enable row level security;

drop policy if exists salon_members_select on public.salon_members;
create policy salon_members_select on public.salon_members
  for select to authenticated
  using (public.can_access_salon(salon_id));

-- Un utilisateur ayant accès au salon peut le rejoindre lui-même.
drop policy if exists salon_members_join_self on public.salon_members;
create policy salon_members_join_self on public.salon_members
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_access_salon(salon_id));

-- Un modérateur peut gérer les membres.
drop policy if exists salon_members_moderate_insert on public.salon_members;
create policy salon_members_moderate_insert on public.salon_members
  for insert to authenticated
  with check (public.can_moderate_salon(salon_id));

drop policy if exists salon_members_update on public.salon_members;
create policy salon_members_update on public.salon_members
  for update to authenticated
  using (user_id = auth.uid() or public.can_moderate_salon(salon_id))
  with check (user_id = auth.uid() or public.can_moderate_salon(salon_id));

drop policy if exists salon_members_delete on public.salon_members;
create policy salon_members_delete on public.salon_members
  for delete to authenticated
  using (user_id = auth.uid() or public.can_moderate_salon(salon_id));

-- -----------------------------------------------------------------------------
-- Vue : participants visibles d'un salon, filtrés par préférence de visibilité
-- -----------------------------------------------------------------------------
create or replace view public.salon_visible_members
with (security_invoker = true)
as
select
  sm.salon_id,
  sm.user_id,
  sm.joined_at,
  sm.role,
  p.username,
  p.display_name,
  p.avatar_url,
  p.bio,
  p.city,
  p.interests
from public.salon_members sm
join public.profiles p on p.id = sm.user_id
where sm.left_at is null
  and public.can_access_salon(sm.salon_id)
  and public.can_view_profile(sm.user_id);

comment on view public.salon_visible_members is
  'Participants d''un salon, filtrés par les préférences de visibilité de chacun.';