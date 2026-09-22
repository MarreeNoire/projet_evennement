-- =============================================================================
--  0027 — RLS : albums et médias (photos / vidéos)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- albums
-- -----------------------------------------------------------------------------
alter table public.albums enable row level security;

drop policy if exists albums_select on public.albums;
create policy albums_select on public.albums
  for select to authenticated
  using (public.can_access_salon(salon_id));

drop policy if exists albums_write on public.albums;
create policy albums_write on public.albums
  for all to authenticated
  using (public.can_moderate_salon(salon_id))
  with check (public.can_moderate_salon(salon_id));

-- -----------------------------------------------------------------------------
-- media
-- -----------------------------------------------------------------------------
alter table public.media enable row level security;

drop policy if exists media_select on public.media;
create policy media_select on public.media
  for select to authenticated
  using (
    public.can_access_salon(salon_id)
    and (media.is_hidden = false or public.can_moderate_salon(salon_id))
  );

-- Un participant peut publier si l'organisateur autorise l'upload de médias.
drop policy if exists media_insert on public.media;
create policy media_insert on public.media
  for insert to authenticated
  with check (
    uploader_id = auth.uid()
    and public.can_access_salon(salon_id)
    and (
      event_id is null
      or exists (
        select 1 from public.events e
        where e.id = media.event_id and e.allow_media_upload = true
      )
    )
  );

drop policy if exists media_update on public.media;
create policy media_update on public.media
  for update to authenticated
  using (
    public.can_moderate_salon(salon_id)
    or (uploader_id = auth.uid() and media.is_hidden = false)
  )
  with check (
    public.can_moderate_salon(salon_id)
    or (uploader_id = auth.uid() and media.is_hidden = false)
  );

drop policy if exists media_delete on public.media;
create policy media_delete on public.media
  for delete to authenticated
  using (public.can_moderate_salon(salon_id) or uploader_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Suite de rapports : hydrate la cible signalée (cible polymorphe)
-- -----------------------------------------------------------------------------
create or replace function public.reports_with_target()
returns table (
  id           uuid,
  reporter_id  uuid,
  target_type  public.report_target,
  target_id    uuid,
  salon_id     uuid,
  event_id     uuid,
  reason       public.report_reason,
  details      text,
  status       public.report_status,
  created_at   timestamptz,
  target_preview text,
  target_author  uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.reporter_id,
    r.target_type,
    r.target_id,
    r.salon_id,
    r.event_id,
    r.reason,
    r.details,
    r.status,
    r.created_at,
    case r.target_type
      when 'post' then (select left(p.content, 200) from public.posts p where p.id = r.target_id)
      when 'comment' then (select left(c.content, 200) from public.comments c where c.id = r.target_id)
      when 'user' then (select p.display_name from public.profiles p where p.id = r.target_id)
      when 'event' then (select e.title from public.events e where e.id = r.target_id)
      when 'message' then (select left(m.content, 200) from public.messages m where m.id = r.target_id)
      else null
    end as target_preview,
    case r.target_type
      when 'post' then (select p.author_id from public.posts p where p.id = r.target_id)
      when 'comment' then (select c.author_id from public.comments c where c.id = r.target_id)
      when 'user' then r.target_id
      when 'message' then (select m.sender_id from public.messages m where m.id = r.target_id)
      else null
    end as target_author
  from public.reports r
  where public.is_admin();
$$;

comment on function public.reports_with_target() is
  'File de modération : signalements enrichis de l''aperçu et de l''auteur de la cible. Réservé aux administrateurs.';