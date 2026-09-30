-- Keep event creation aligned with the organizer permissions used by the app.
-- This SECURITY DEFINER helper reads ownership/membership records without
-- recursively invoking their RLS policies when events are inserted.
create or replace function public.can_create_event_in_org(
  p_organization_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_user_id is not null and (
    public.is_admin(p_user_id)
    or exists (
      select 1
      from public.organizations o
      where o.id = p_organization_id
        and o.owner_id = p_user_id
    )
    or exists (
      select 1
      from public.organization_members m
      where m.organization_id = p_organization_id
        and m.user_id = p_user_id
        and m.status = 'active'
        and m.role in ('owner', 'manager')
    )
  );
$$;

revoke all on function public.can_create_event_in_org(uuid, uuid) from public;
grant execute on function public.can_create_event_in_org(uuid, uuid) to authenticated;

drop policy if exists events_insert_managers on public.events;
create policy events_insert_managers on public.events
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.can_create_event_in_org(organization_id, auth.uid())
  );
