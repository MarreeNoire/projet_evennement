-- Images de couverture pour les tontines et les collectes.

alter table public.tontines
  add column if not exists cover_url text;

alter table public.cotisation_campaigns
  add column if not exists cover_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-covers',
  'community-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists community_covers_read on storage.objects;
create policy community_covers_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'community-covers');

drop policy if exists community_covers_write_own on storage.objects;
create policy community_covers_write_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'community-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists community_covers_delete_own on storage.objects;
create policy community_covers_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'community-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
