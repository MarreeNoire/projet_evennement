-- =============================================================================
--  0021 — RLS : rôles applicatifs et organisations
-- =============================================================================

-- -----------------------------------------------------------------------------
-- user_roles
-- -----------------------------------------------------------------------------
alter table public.user_roles enable row level security;

drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists user_roles_write_admin on public.user_roles;
create policy user_roles_write_admin on public.user_roles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- organizations
-- -----------------------------------------------------------------------------
alter table public.organizations enable row level security;

drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations
  for select to authenticated
  using (is_active = true or public.can_manage_org(id));

drop policy if exists organizations_insert_owner on public.organizations;
create policy organizations_insert_owner on public.organizations
  for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists organizations_update_managers on public.organizations;
create policy organizations_update_managers on public.organizations
  for update to authenticated
  using (public.can_manage_org(id))
  with check (public.can_manage_org(id));

drop policy if exists organizations_delete_owner on public.organizations;
create policy organizations_delete_owner on public.organizations
  for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- organization_members
-- -----------------------------------------------------------------------------
alter table public.organization_members enable row level security;

drop policy if exists organization_members_select on public.organization_members;
create policy organization_members_select on public.organization_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.can_manage_org(organization_id)
    or invited_email is not null
  );

drop policy if exists organization_members_insert on public.organization_members;
create policy organization_members_insert on public.organization_members
  for insert to authenticated
  with check (public.can_manage_org(organization_id));

drop policy if exists organization_members_update on public.organization_members;
create policy organization_members_update on public.organization_members
  for update to authenticated
  using (public.can_manage_org(organization_id) or user_id = auth.uid())
  with check (public.can_manage_org(organization_id) or user_id = auth.uid());

drop policy if exists organization_members_delete on public.organization_members;
create policy organization_members_delete on public.organization_members
  for delete to authenticated
  using (public.can_manage_org(organization_id) or user_id = auth.uid());