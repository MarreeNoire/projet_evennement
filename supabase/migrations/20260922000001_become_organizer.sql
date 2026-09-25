-- =============================================================================
--  0034 — Auto-service : devenir organisateur
--  --------------------------------------------------------------------------
--  `user_roles` n'autorise l'écriture qu'aux administrateurs (cf. 0021), donc
--  un utilisateur ne peut pas s'auto-attribuer le rôle `organizer` par un
--  simple insert client. Cette fonction security definer l'autorise de façon
--  contrôlée : elle attribue le rôle et crée l'organisation en une seule
--  transaction atomique, pour l'utilisateur courant uniquement.
-- =============================================================================

create or replace function public.become_organizer(p_org_name text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.organizations;
  v_base_slug text;
  v_slug text;
  v_suffix int := 0;
  v_name text := trim(coalesce(p_org_name, ''));
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.';
  end if;

  if char_length(v_name) < 2 then
    raise exception 'Le nom de l''organisation doit contenir au moins 2 caractères.';
  end if;

  if char_length(v_name) > 120 then
    v_name := left(v_name, 120);
  end if;

  -- Slug : minuscules, sans accents, caractères non alphanumériques -> '-'.
  v_base_slug := public.immutable_unaccent(lower(v_name));
  v_base_slug := regexp_replace(v_base_slug, '[^a-z0-9]+', '-', 'g');
  v_base_slug := trim(both '-' from v_base_slug);
  v_base_slug := left(v_base_slug, 60);

  if v_base_slug = '' then
    v_base_slug := 'organisation';
  end if;
  if char_length(v_base_slug) < 3 then
    v_base_slug := rpad(v_base_slug, 3, '0');
  end if;

  v_slug := v_base_slug;
  while exists (select 1 from public.organizations where slug = v_slug) loop
    v_suffix := v_suffix + 1;
    v_slug := left(v_base_slug, 60 - char_length('-' || v_suffix::text)) || '-' || v_suffix::text;
  end loop;

  -- Attribution du rôle : idempotent si déjà organisateur.
  insert into public.user_roles (user_id, role)
  values (auth.uid(), 'organizer')
  on conflict (user_id, role) do nothing;

  insert into public.organizations (owner_id, name, slug)
  values (auth.uid(), v_name, v_slug)
  returning * into v_org;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (v_org.id, auth.uid(), 'owner', 'active')
  on conflict (organization_id, user_id) do nothing;

  return v_org;
end;
$$;

comment on function public.become_organizer(text) is
  'Auto-service : attribue le rôle organizer à l''utilisateur courant et crée son organisation.';
