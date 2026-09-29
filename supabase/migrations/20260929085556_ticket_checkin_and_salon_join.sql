-- Restrict ticket check-in to the authenticated organizer team for the
-- selected event. The scanner identity must always come from Supabase Auth.
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
  v_event_status public.event_status;
  v_scanner_id uuid := auth.uid();
begin
  if v_scanner_id is null or p_scanner_id is distinct from v_scanner_id then
    raise exception 'Authentification requise pour contrôler un billet.'
      using errcode = '42501';
  end if;

  select e.status into v_event_status
  from public.events e
  where e.id = p_event_id;

  if not found then
    raise exception 'Événement introuvable.' using errcode = 'P0002';
  end if;

  if not (
    public.is_admin(v_scanner_id)
    or public.can_manage_event(p_event_id, v_scanner_id)
    or exists (
      select 1
      from public.events e
      join public.organization_members om
        on om.organization_id = e.organization_id
      where e.id = p_event_id
        and om.user_id = v_scanner_id
        and om.status = 'active'
        and om.role = 'checkin_agent'
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
    where upper(t.reference) = upper(v_code)
    limit 1
    for update;
  end if;

  if v_ticket.id is null then
    insert into public.check_ins (ticket_id, event_id, scanned_by, result, scanned_code)
    values (null, p_event_id, v_scanner_id, 'invalid', v_code);

    return query select
      'invalid'::public.checkin_result,
      null::uuid, null::text, null::text, null::text,
      null::public.access_level, 'Billet introuvable.'::text;
    return;
  end if;

  select tt.name into v_type_name
  from public.ticket_types tt
  where tt.id = v_ticket.ticket_type_id;

  v_result := case
    when v_event_status = 'cancelled' then 'cancelled'
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
    set status = 'used', checked_in_at = now(), checked_in_by = v_scanner_id
    where id = v_ticket.id;
    v_message := 'Accès autorisé. Bienvenue !';
  else
    v_message := case v_result
      when 'wrong_event' then 'Ce billet appartient à un autre événement.'
      when 'unpaid' then 'Ce billet n''a pas été payé.'
      when 'cancelled' then 'Cet événement ou ce billet a été annulé.'
      when 'refunded' then 'Ce billet a été remboursé.'
      when 'already_used' then 'Ce billet a déjà été utilisé.'
      else 'Ce billet est invalide.'
    end;
  end if;

  insert into public.check_ins (ticket_id, event_id, scanned_by, result, scanned_code, note)
  values (v_ticket.id, p_event_id, v_scanner_id, v_result, v_code, v_message);

  return query select
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
  'Contrôle un billet une seule fois pour un événement sélectionné et journalise chaque tentative. Réservé à l''organisation et à ses agents de contrôle.';

revoke all on function public.perform_check_in(uuid, text, uuid) from public, anon;
grant execute on function public.perform_check_in(uuid, text, uuid) to authenticated;
