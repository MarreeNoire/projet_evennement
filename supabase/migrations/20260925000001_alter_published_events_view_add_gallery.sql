-- =============================================================================
--  Recreate published_events to include the event gallery.
--  CREATE OR REPLACE VIEW cannot insert a column into the existing definition.
-- =============================================================================

drop view if exists public.published_events;

create view public.published_events
with (security_invoker = true)
as
select
  e.id,
  e.organization_id,
  e.title,
  e.slug,
  e.summary,
  e.cover_url,
  e.gallery,
  e.category,
  e.tags,
  e.venue_name,
  e.address,
  e.city,
  e.country,
  e.start_at,
  e.end_at,
  e.timezone,
  e.capacity,
  e.min_price,
  e.max_price,
  e.currency,
  e.salon_privacy,
  o.name  as organizer_name,
  o.slug  as organizer_slug,
  o.logo_url as organizer_logo_url,
  o.is_verified as organizer_verified
from public.events e
join public.organizations o on o.id = e.organization_id
where e.status = 'published'
  and e.end_at >= now();

comment on view public.published_events is
  'Vue publique des événements à venir, jointure organisateur incluse.';