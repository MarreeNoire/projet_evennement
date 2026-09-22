-- =============================================================================
--  0020 — RLS : profils et contrôle de visibilité (cf. §16 du cahier)
-- =============================================================================

-- Peut-on consulter ce profil ?
--  * soi-même, ou administrateur ;
--  * visibilité « public » et recherche autorisée ;
--  * visibilité « membres » et au moins un événement payé en commun ;
--  * personnes déjà connectées entre elles.
create or replace function public.can_view_profile(target_id uuid, viewer_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    target_id = viewer_id
    or public.is_admin(viewer_id)
    or exists (
      select 1 from public.profiles p
      where p.id = target_id and p.visibility = 'public' and p.allow_search = true
    )
    or (
      exists (
        select 1 from public.profiles p
        where p.id = target_id and p.visibility = 'members'
      )
      and exists (
        select 1
        from public.tickets mine
        join public.tickets theirs on theirs.event_id = mine.event_id
        where mine.user_id = viewer_id
          and theirs.user_id = target_id
          and mine.status in ('paid', 'used')
          and theirs.status in ('paid', 'used')
      )
    )
    or exists (
      select 1 from public.connections c
      where c.status = 'accepted'
        and (
          (c.requester_id = viewer_id and c.addressee_id = target_id)
          or (c.requester_id = target_id and c.addressee_id = viewer_id)
        )
    );
$$;

comment on function public.can_view_profile(uuid, uuid) is
  'Applique les règles de visibilité du profil : public, participants communs ou connexions.';

alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (public.can_view_profile(id));

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles
  for delete to authenticated
  using (public.is_admin());