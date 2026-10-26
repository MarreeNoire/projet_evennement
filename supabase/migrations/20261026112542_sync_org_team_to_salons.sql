-- Keep team access in existing event salons in sync with organization_members.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.sync_organization_member_salons()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_organization_id uuid;
  target_user_id uuid;
  target_status text;
begin
  if tg_op = 'DELETE' then
    target_organization_id := old.organization_id;
    target_user_id := old.user_id;
    target_status := 'removed';
  else
    target_organization_id := new.organization_id;
    target_user_id := new.user_id;
    target_status := new.status;
  end if;

  if auth.uid() is null
     or not public.can_manage_org(target_organization_id, auth.uid()) then
    -- Allow organization cascades; those salons are being deleted as well.
    if exists (select 1 from public.organizations o where o.id = target_organization_id) then
      raise exception 'Not authorized to synchronize organization salon access.'
        using errcode = '42501';
    end if;
    return null;
  end if;

  if target_user_id is null then
    return null;
  end if;

  if target_status <> 'active' then
    update public.salon_members sm
    set left_at = coalesce(sm.left_at, now())
    from public.salons s
    where sm.salon_id = s.id
      and s.organization_id = target_organization_id
      and sm.user_id = target_user_id
      and sm.role <> 'owner'
      and sm.left_at is null;
    return null;
  end if;

  insert into public.salon_members as existing_member (salon_id, user_id, role)
  select s.id, target_user_id, 'moderator'
  from public.salons s
  where s.organization_id = target_organization_id
  on conflict (salon_id, user_id) do update
    set role = case
      when existing_member.role = 'owner' then 'owner'::public.org_role
      else 'moderator'::public.org_role
    end,
    joined_at = case
      when existing_member.left_at is not null then now()
      else existing_member.joined_at
    end,
    left_at = null;

  return null;
end;
$$;

drop trigger if exists organization_member_sync_salons on public.organization_members;
create trigger organization_member_sync_salons
  after insert or update of organization_id, user_id, role, status or delete
  on public.organization_members
  for each row execute function private.sync_organization_member_salons();

revoke all on function private.sync_organization_member_salons() from public, anon, authenticated;

-- Inactive team entries must not retain moderator access to an existing salon.
update public.salon_members sm
set left_at = coalesce(sm.left_at, now())
from public.salons s
join public.organization_members om on om.organization_id = s.organization_id
where sm.salon_id = s.id
  and sm.user_id = om.user_id
  and om.status <> 'active'
  and sm.role <> 'owner'
  and sm.left_at is null;

-- Repair existing active team members who were added after their event salons.
insert into public.salon_members as existing_member (salon_id, user_id, role)
select s.id, om.user_id, 'moderator'::public.org_role
from public.salons s
join public.organization_members om on om.organization_id = s.organization_id
where om.status = 'active'
  and om.user_id is not null
on conflict (salon_id, user_id) do update
  set role = case
    when existing_member.role = 'owner' then 'owner'::public.org_role
    else 'moderator'::public.org_role
  end,
  left_at = null;
