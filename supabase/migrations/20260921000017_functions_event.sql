-- =============================================================================
--  0017 — Fonctions : tarification de l'événement et salon automatique
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Fourchette de prix de l'événement (0 = gratuit)
-- -----------------------------------------------------------------------------
create or replace function public.sync_event_price_range()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_event uuid := coalesce(new.event_id, old.event_id);
begin
  update public.events e
  set min_price = coalesce(stats.min_price, 0),
      max_price = coalesce(stats.max_price, 0)
  from (
    select min(price) as min_price, max(price) as max_price
    from public.ticket_types
    where event_id = target_event
      and is_active = true
  ) as stats
  where e.id = target_event;

  return null;
end;
$$;

comment on function public.sync_event_price_range() is
  'Maintient events.min_price / max_price à partir des billets actifs.';

drop trigger if exists ticket_types_sync_event_price on public.ticket_types;
create trigger ticket_types_sync_event_price
  after insert or update or delete on public.ticket_types
  for each row execute function public.sync_event_price_range();

-- -----------------------------------------------------------------------------
-- Création du salon d'un événement (cf. §12 du cahier)
--  Idempotente : retourne le salon existant s'il y en a déjà un.
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

  -- Le propriétaire de l'organisation devient propriétaire du salon.
  insert into public.salon_members (salon_id, user_id, role)
  select new_salon_id, o.owner_id, 'owner'
  from public.organizations o
  where o.id = event_row.organization_id
  on conflict (salon_id, user_id) do update
    set role = 'owner', left_at = null;

  -- Les membres de l'équipe rejoignent comme modérateurs.
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

comment on function public.ensure_event_salon(uuid) is
  'Garantit l''existence du salon d''un événement et y inscrit son équipe organisatrice.';