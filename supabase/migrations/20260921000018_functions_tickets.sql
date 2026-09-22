-- =============================================================================
--  0018 — Fonctions : génération des billets et adhésion automatique au salon
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Génération des billets d'une commande payée
--  Idempotente : peut être rejouée sans risque depuis le webhook de paiement.
-- -----------------------------------------------------------------------------
create or replace function public.generate_tickets_for_order(target_order_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  order_row public.orders;
  item_row record;
  existing_count integer;
  missing_count integer;
  created_count integer := 0;
  line_index integer;
begin
  select * into order_row from public.orders where id = target_order_id;

  if order_row is null then
    raise exception 'Commande % introuvable', target_order_id;
  end if;

  if order_row.status <> 'paid' then
    raise exception 'La commande % n''est pas payée (statut : %)', target_order_id, order_row.status;
  end if;

  for item_row in
    select oi.id, oi.quantity, oi.unit_price, oi.ticket_type_id, tt.access_level
    from public.order_items oi
    join public.ticket_types tt on tt.id = oi.ticket_type_id
    where oi.order_id = target_order_id
  loop
    select count(*) into existing_count
    from public.tickets t
    where t.order_item_id = item_row.id;

    missing_count := item_row.quantity - existing_count;

    if missing_count <= 0 then
      continue;
    end if;

    for line_index in 1 .. missing_count loop
      insert into public.tickets (
        reference, order_id, order_item_id, event_id, user_id,
        ticket_type_id, status, access_level, holder_name, holder_email, price_paid
      )
      values (
        'TCK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
        order_row.id,
        item_row.id,
        order_row.event_id,
        order_row.user_id,
        item_row.ticket_type_id,
        'paid',
        item_row.access_level,
        order_row.buyer_name,
        order_row.buyer_email,
        item_row.unit_price
      );

      created_count := created_count + 1;
    end loop;
  end loop;

  -- Resynchronise les compteurs de vente des types de billets concernés.
  update public.ticket_types tt
  set sold_count = (
    select count(*)
    from public.tickets t
    where t.ticket_type_id = tt.id
      and t.status in ('paid', 'used')
  )
  where tt.id in (
    select ticket_type_id from public.order_items where order_id = target_order_id
  );

  return created_count;
end;
$$;

comment on function public.generate_tickets_for_order(uuid) is
  'Crée les billets d''une commande payée. Idempotente et sûre à rejouer.';

-- -----------------------------------------------------------------------------
-- Adhésion automatique au salon dès que le billet devient valide (cf. §12)
-- -----------------------------------------------------------------------------
create or replace function public.auto_join_event_salons()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('paid', 'used')
     and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    insert into public.salon_members (salon_id, user_id, role)
    select s.id, new.user_id, 'manager'
    from public.salons s
    where s.event_id = new.event_id
      and s.auto_join = true
      and s.archived_at is null
      and (s.access_level = 'standard' or new.access_level in ('vip', 'vvip'))
    on conflict (salon_id, user_id) do update set left_at = null;
  end if;

  return null;
end;
$$;

comment on function public.auto_join_event_salons() is
  'Ajoute automatiquement le détenteur d''un billet payé aux salons de l''événement.';

drop trigger if exists tickets_auto_join_salons on public.tickets;
create trigger tickets_auto_join_salons
  after insert or update of status on public.tickets
  for each row execute function public.auto_join_event_salons();

-- -----------------------------------------------------------------------------
-- Enregistrement d'une action sensible dans le journal d'audit
--  (règles métier n°12 et n°13)
-- -----------------------------------------------------------------------------
create or replace function public.log_audit(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_organization_id uuid default null,
  p_event_id uuid default null,
  p_before jsonb default null,
  p_after jsonb default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id,
    organization_id, event_id, before, after
  )
  values (
    auth.uid(), p_action, p_entity_type, p_entity_id,
    p_organization_id, p_event_id, p_before, p_after
  );
$$;

comment on function public.log_audit(text, text, uuid, uuid, uuid, jsonb, jsonb) is
  'Écrit une entrée dans le journal d''audit pour l''utilisateur courant.';