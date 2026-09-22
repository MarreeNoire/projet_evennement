-- =============================================================================
--  0032 — Stockage des fichiers (Supabase Storage)
--  Conventions de chemin :
--    avatars/{user_id}/{fichier}
--    event-covers/{event_id}/{fichier}
--    salon-photos/{salon_id}/{fichier}
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Création des buckets
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    true,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'event-covers',
    'event-covers',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'salon-photos',
    'salon-photos',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4']
  )
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- avatars : lecture publique, écriture dans son propre dossier
-- -----------------------------------------------------------------------------
drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatars');

drop policy if exists avatars_write_own on storage.objects;
create policy avatars_write_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- -----------------------------------------------------------------------------
-- event-covers : lecture publique, écriture par les gestionnaires de l'événement
-- -----------------------------------------------------------------------------
drop policy if exists event_covers_read on storage.objects;
create policy event_covers_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'event-covers');

drop policy if exists event_covers_write on storage.objects;
create policy event_covers_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] ~
        '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and public.can_manage_event((storage.foldername(name))[1]::uuid)
  );

drop policy if exists event_covers_update on storage.objects;
create policy event_covers_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'event-covers'
    and public.can_manage_event((storage.foldername(name))[1]::uuid)
  );

drop policy if exists event_covers_delete on storage.objects;
create policy event_covers_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'event-covers'
    and public.can_manage_event((storage.foldername(name))[1]::uuid)
  );

-- -----------------------------------------------------------------------------
-- salon-photos : accès restreint aux membres du salon
--  Les fichiers privés sont servis via URL signées générées côté serveur.
-- -----------------------------------------------------------------------------
drop policy if exists salon_photos_read on storage.objects;
create policy salon_photos_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'salon-photos'
    and (storage.foldername(name))[1] ~
        '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and public.can_access_salon((storage.foldername(name))[1]::uuid)
  );

drop policy if exists salon_photos_write on storage.objects;
create policy salon_photos_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'salon-photos'
    and (storage.foldername(name))[1] ~
        '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and public.can_access_salon((storage.foldername(name))[1]::uuid)
  );

drop policy if exists salon_photos_delete on storage.objects;
create policy salon_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'salon-photos'
    and public.can_moderate_salon((storage.foldername(name))[1]::uuid)
  );