-- =============================================================================
--  0023 — RLS : types de billets, codes promo et statistiques d'événement
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ticket_types
-- -----------------------------------------------------------------------------
alter table public.ticket_types enable row level security;

drop policy if exists ticket_types_select on public.ticket_types;
create policy ticket_types_select on public.ticket_types
  for select to anon, authenticated
  using (
    exists (select 1 from public.events e where e.id = event_id and e.status = 'published')
    or public.can_manage_event(event_id)
  );

drop policy if exists ticket_types_write on public.ticket_types;
create policy ticket_types_write on public.ticket_types
  for all to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));

-- -----------------------------------------------------------------------------
-- promo_codes : jamais lisibles par les acheteurs, validés côté serveur
-- -----------------------------------------------------------------------------
alter table public.promo_codes enable row level security;

drop policy if exists promo_codes_manage on public.promo_codes;
create policy promo_codes_manage on public.promo_codes
  for all to authenticated
  using (public.can_manage_org(organization_id))
  with check (public.can_manage_org(organization_id));

-- -----------------------------------------------------------------------------
-- event_stats : statistiques agrégées pour le tableau de bord organisateur
-- -----------------------------------------------------------------------------
create or replace view public.event_stats
with (security_invoker = true)
as
select
  e.id                            as event_id,
  e.organization_id,
  e.status,
  e.start_at,
  e.capacity,
  coalesce(paid.tickets_sold, 0)  as tickets_sold,
  coalesce(paid.gross_revenue, 0) as gross_revenue,
  coalesce(paid.commission, 0)    as commission,
  coalesce(paid.net_revenue, 0)   as net_revenue,
  coalesce(paid.paid_orders, 0)   as paid_orders,
  coalesce(checked.checked_in, 0) as checked_in,
  coalesce(salon.members, 0)      as salon_members,
  coalesce(posts_count.total_posts, 0) as salon_posts
from public.events e
left join (
  select
    t.event_id,
    count(*) filter (where t.status in ('paid', 'used'))                        as tickets_sold,
    coalesce(sum(t.price_paid) filter (where t.status in ('paid', 'used')), 0)  as gross_revenue,
    count(distinct o.id) filter (where o.status = 'paid')                       as paid_orders,
    coalesce(sum(o.commission) filter (where o.status = 'paid'), 0)             as commission,
    coalesce(sum(o.total) filter (where o.status = 'paid'), 0)
      - coalesce(sum(o.commission) filter (where o.status = 'paid'), 0)         as net_revenue
  from public.tickets t
  join public.orders o on o.id = t.order_id
  group by t.event_id
) paid on paid.event_id = e.id
left join (
  select event_id, count(*) as checked_in
  from public.tickets
  where checked_in_at is not null
  group by event_id
) checked on checked.event_id = e.id
left join (
  select event_id, count(*) as members
  from public.salons
  where event_id is not null
  group by event_id
) salon on salon.event_id = e.id
left join (
  select s.event_id, count(p.id) as total_posts
  from public.salons s
  join public.posts p on p.salon_id = s.id
  group by s.event_id
) posts_count on posts_count.event_id = e.id;

comment on view public.event_stats is
  'Statistiques par événement : ventes, revenus, commission, entrées, salon.';