-- =============================================================================
--  0022 — RLS : événements, programme et intervenants
-- =============================================================================

-- -----------------------------------------------------------------------------
-- events
-- -----------------------------------------------------------------------------
alter table public.events enable row level security;

drop policy if exists events_select_authenticated on public.events;
create policy events_select_authenticated on public.events
  for select to authenticated
  using (status = 'published' or public.can_manage_event(id));

drop policy if exists events_select_anon on public.events;
create policy events_select_anon on public.events
  for select to anon
  using (status = 'published');

drop policy if exists events_insert_managers on public.events;
create policy events_insert_managers on public.events
  for insert to authenticated
  with check (public.can_manage_org(organization_id) and created_by = auth.uid());

drop policy if exists events_update_managers on public.events;
create policy events_update_managers on public.events
  for update to authenticated
  using (public.can_manage_event(id))
  with check (public.can_manage_event(id));

drop policy if exists events_delete_managers on public.events;
create policy events_delete_managers on public.events
  for delete to authenticated
  using (public.can_manage_event(id));

-- -----------------------------------------------------------------------------
-- event_sessions
-- -----------------------------------------------------------------------------
alter table public.event_sessions enable row level security;

drop policy if exists event_sessions_select on public.event_sessions;
create policy event_sessions_select on public.event_sessions
  for select to anon, authenticated
  using (
    exists (select 1 from public.events e where e.id = event_id and e.status = 'published')
    or public.can_manage_event(event_id)
  );

drop policy if exists event_sessions_write on public.event_sessions;
create policy event_sessions_write on public.event_sessions
  for all to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));

-- -----------------------------------------------------------------------------
-- event_speakers
-- -----------------------------------------------------------------------------
alter table public.event_speakers enable row level security;

drop policy if exists event_speakers_select on public.event_speakers;
create policy event_speakers_select on public.event_speakers
  for select to anon, authenticated
  using (
    exists (select 1 from public.events e where e.id = event_id and e.status = 'published')
    or public.can_manage_event(event_id)
  );

drop policy if exists event_speakers_write on public.event_speakers;
create policy event_speakers_write on public.event_speakers
  for all to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));

-- -----------------------------------------------------------------------------
-- event_session_bookmarks : programme personnel d'un participant
-- -----------------------------------------------------------------------------
alter table public.event_session_bookmarks enable row level security;

drop policy if exists event_session_bookmarks_own on public.event_session_bookmarks;
create policy event_session_bookmarks_own on public.event_session_bookmarks
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Vue publique : prochains événements (sans exposer les brouillons)
-- -----------------------------------------------------------------------------
create or replace view public.published_events
with (security_invoker = true)
as
select
  e.id,
  e.organization_id,
  e.title,
  e.slug,
  e.summary,
  e.cover_url,
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