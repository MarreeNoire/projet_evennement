-- Role assignments are serialized so concurrent admin actions cannot remove
-- the final administrator.
create or replace function public.admin_set_user_role(
  p_user_id uuid,
  p_role public.user_role,
  p_grant boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_exists boolean;
  v_admin_count integer;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext('public.admin_set_user_role'));

  -- Recheck after waiting for the lock in case this admin's role changed.
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'USER_NOT_FOUND' using errcode = 'P0002';
  end if;

  select exists (
    select 1 from public.user_roles where user_id = p_user_id and role = p_role
  ) into v_role_exists;

  if v_role_exists = p_grant then
    return;
  end if;

  if p_grant then
    insert into public.user_roles (user_id, role, granted_by)
    values (p_user_id, p_role, auth.uid())
    on conflict (user_id, role) do nothing;
  else
    if p_role = 'admin' then
      select count(*) into v_admin_count
      from public.user_roles
      where role = 'admin';

      if v_admin_count <= 1 then
        raise exception 'LAST_ADMIN' using errcode = '23514';
      end if;
    end if;

    delete from public.user_roles
    where user_id = p_user_id and role = p_role;
  end if;

  perform public.log_audit(
    case when p_grant then 'user.role.grant' else 'user.role.revoke' end,
    'user_role',
    p_user_id,
    null,
    null,
    jsonb_build_object('role', p_role, 'granted', not p_grant),
    jsonb_build_object('role', p_role, 'granted', p_grant)
  );
end;
$$;

revoke all on function public.admin_set_user_role(uuid, public.user_role, boolean) from public;
grant execute on function public.admin_set_user_role(uuid, public.user_role, boolean) to authenticated;

comment on function public.admin_set_user_role(uuid, public.user_role, boolean) is
  'Attribue ou retire un rôle applicatif, avec contrôle admin, protection du dernier administrateur et journalisation.';
