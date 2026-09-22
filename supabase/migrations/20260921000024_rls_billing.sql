-- =============================================================================
--  0024 — RLS : commandes, paiements, billets et check-in
--  Les écritures sensibles passent par le serveur (service_role) ou par des
--  fonctions SECURITY DEFINER, jamais directement depuis le navigateur.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- orders
-- -----------------------------------------------------------------------------
alter table public.orders enable row level security;

drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.can_manage_event(event_id)
  );

drop policy if exists orders_insert_self on public.orders;
create policy orders_insert_self on public.orders
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists orders_update_owner_pending on public.orders;
create policy orders_update_owner_pending on public.orders
  for update to authenticated
  using (
    (user_id = auth.uid() and status = 'pending')
    or public.can_manage_event(event_id)
  )
  with check (
    (user_id = auth.uid() and status in ('pending', 'cancelled'))
    or public.can_manage_event(event_id)
  );

-- -----------------------------------------------------------------------------
-- order_items (lecture seule côté client)
-- -----------------------------------------------------------------------------
alter table public.order_items enable row level security;

drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or public.can_manage_event(o.event_id))
    )
  );

-- -----------------------------------------------------------------------------
-- payments : consultation par le propriétaire et l'organisateur uniquement
-- -----------------------------------------------------------------------------
alter table public.payments enable row level security;

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
  for select to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or public.can_manage_event(o.event_id))
    )
  );

-- -----------------------------------------------------------------------------
-- tickets
-- -----------------------------------------------------------------------------
alter table public.tickets enable row level security;

drop policy if exists tickets_select on public.tickets;
create policy tickets_select on public.tickets
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.can_manage_event(event_id)
  );

-- Le détenteur peut uniquement annuler son propre billet non utilisé.
drop policy if exists tickets_update_holder on public.tickets;
create policy tickets_update_holder on public.tickets
  for update to authenticated
  using (
    public.can_manage_event(event_id)
    or (user_id = auth.uid() and status in ('pending', 'paid'))
  )
  with check (
    public.can_manage_event(event_id)
    or (user_id = auth.uid() and status in ('pending', 'paid', 'cancelled'))
  );

-- -----------------------------------------------------------------------------
-- check_ins : lisible par l'organisation, écrit uniquement par perform_check_in
-- -----------------------------------------------------------------------------
alter table public.check_ins enable row level security;

drop policy if exists check_ins_select on public.check_ins;
create policy check_ins_select on public.check_ins
  for select to authenticated
  using (public.can_manage_event(event_id));

-- -----------------------------------------------------------------------------
-- Vue : billets du participant, prête à afficher
-- -----------------------------------------------------------------------------
create or replace view public.my_tickets
with (security_invoker = true)
as
select
  t.id,
  t.reference,
  t.qr_token,
  t.status,
  t.access_level,
  t.holder_name,
  t.price_paid,
  t.checked_in_at,
  t.created_at,
  e.id            as event_id,
  e.title         as event_title,
  e.slug          as event_slug,
  e.cover_url     as event_cover_url,
  e.start_at      as event_start_at,
  e.end_at        as event_end_at,
  e.venue_name,
  e.city,
  tt.name         as ticket_type_name,
  tt.benefits     as ticket_benefits,
  o.slug          as organizer_slug,
  o.name          as organizer_name
from public.tickets t
join public.events e on e.id = t.event_id
join public.ticket_types tt on tt.id = t.ticket_type_id
join public.organizations o on o.id = e.organization_id
where t.user_id = auth.uid();

comment on view public.my_tickets is
  'Billets de l''utilisateur connecté, avec informations d''événement prêtes à afficher.';