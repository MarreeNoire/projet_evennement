-- =============================================================================
--  0019 — Fonctions : contrôle d'accès à l'entrée (cf. §27 du cahier)
-- =============================================================================

-- Valide un billet à l'entrée.
--  * Verrouille la ligne du billet (FOR UPDATE) : empêche tout double scan
--    concurrent, même avec plusieurs agents simultanés.
--  * Journalise TOUJOURS la tentative dans check_ins, valide ou non.
--  * Vérifie : existence, appartenance à l'événement, paiement, statut,
--    absence de scan précédent, annulation, remboursement.
create or replace function public.perform_check_in(
  p_event_id uuid,
  p_code text,
  p_scanner_id uuid default auth.uid()
)
returns table (
  result           public.checkin_result,
  ticket_id        uuid,
  ticket_reference text,
  holder_name      text,
  ticket_type_name text,
  access_level     public.access_level,
  message          text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.tickets;
  v_type_name text;
  v_result public.checkin_result;
  v_message text;
  v_code text := trim(coalesce(p_code, ''));
  v_is_uuid boolean;
begin
  -- Autorisation : admin, gestionnaire de l'événement ou membre de l'organisation.
  if not (
    public.is_admin(p_scanner_id)
    or public.can_manage_event(p_event_id, p_scanner_id)
    or exists (
      select 1
      from public.events e
      where e.id = p_event_id
        and public.is_org_member(e.organization_id, p_scanner_id)
    )
  ) then
    raise exception 'Accès refusé : vous n''êtes pas autorisé à contrôler cet événement.'
      using errcode = '42501';
  end if;

  v_is_uuid := v_code ~
    '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

  if v_is_uuid then
    select * into v_ticket
    from public.tickets t
    where t.qr_token = v_code::uuid
    limit 1
    for update;
  else
    select * into v_ticket
    from public.tickets t
    where t.reference = v_code
    limit 1
    for update;
  end if;

  -- Billet introuvable
  if v_ticket.id is null then
    insert into public.check_ins (ticket_id, event_id, scanned_by, result, scanned_code)
    values (null, p_event_id, p_scanner_id, 'invalid', v_code);

    return query
      select
        'invalid'::public.checkin_result,
        null::uuid,
        null::text,
        null::text,
        null::text,
        null::public.access_level,
        'Billet introuvable.'::text;
    return;
  end if;

  select tt.name into v_type_name
  from public.ticket_types tt
  where tt.id = v_ticket.ticket_type_id;

  v_result := case
    when v_ticket.event_id <> p_event_id then 'wrong_event'
    when v_ticket.status = 'pending' then 'unpaid'
    when v_ticket.status = 'cancelled' then 'cancelled'
    when v_ticket.status = 'refunded' then 'refunded'
    when v_ticket.status = 'expired' then 'invalid'
    when v_ticket.status = 'used' or v_ticket.checked_in_at is not null then 'already_used'
    else 'valid'
  end;

  if v_result = 'valid' then
    update public.tickets
    set status = 'used',
        checked_in_at = now(),
        checked_in_by = p_scanner_id
    where id = v_ticket.id;

    v_message := 'Accès autorisé. Bienvenue !';
  else
    v_message := case v_result
      when 'wrong_event' then 'Ce billet appartient à un autre événement.'
      when 'unpaid' then 'Ce billet n''a pas été payé.'
      when 'cancelled' then 'Ce billet a été annulé.'
      when 'refunded' then 'Ce billet a été remboursé.'
      when 'already_used' then 'Ce billet a déjà été utilisé.'
      else 'Ce billet est invalide.'
    end;
  end if;

  insert into public.check_ins (ticket_id, event_id, scanned_by, result, scanned_code, note)
  values (v_ticket.id, p_event_id, p_scanner_id, v_result, v_code, v_message);

  return query
    select
      v_result,
      v_ticket.id,
      v_ticket.reference::text,
      coalesce(v_ticket.holder_name, 'Participant'),
      v_type_name,
      v_ticket.access_level,
      v_message;
end;
$$;

comment on function public.perform_check_in(uuid, text, uuid) is
  'Valide un billet à l''entrée et journalise la tentative. Résistant aux scans concurrents.';