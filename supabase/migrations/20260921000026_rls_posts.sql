-- =============================================================================
--  0026 — RLS : publications, commentaires et réactions
-- =============================================================================

-- -----------------------------------------------------------------------------
-- posts
-- -----------------------------------------------------------------------------
alter table public.posts enable row level security;

drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts
  for select to authenticated
  using (
    public.can_access_salon(salon_id)
    and (is_hidden = false or public.can_moderate_salon(salon_id))
  );

drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.can_access_salon(salon_id)
    and (kind = 'post' or public.can_moderate_salon(salon_id))
  );

drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts
  for update to authenticated
  using (
    public.can_moderate_salon(salon_id)
    or (author_id = auth.uid() and is_hidden = false)
  )
  with check (
    public.can_moderate_salon(salon_id)
    or (author_id = auth.uid() and is_hidden = false)
  );

drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts
  for delete to authenticated
  using (public.can_moderate_salon(salon_id) or author_id = auth.uid());

-- -----------------------------------------------------------------------------
-- comments
-- -----------------------------------------------------------------------------
alter table public.comments enable row level security;

drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments
  for select to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id
        and public.can_access_salon(p.salon_id)
        and (comments.is_hidden = false or public.can_moderate_salon(p.salon_id))
    )
  );

drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.posts p
      where p.id = post_id
        and p.is_hidden = false
        and public.can_access_salon(p.salon_id)
    )
  );

drop policy if exists comments_update on public.comments;
create policy comments_update on public.comments
  for update to authenticated
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.posts p
      where p.id = post_id and public.can_moderate_salon(p.salon_id)
    )
  )
  with check (
    author_id = auth.uid()
    or exists (
      select 1 from public.posts p
      where p.id = post_id and public.can_moderate_salon(p.salon_id)
    )
  );

drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments
  for delete to authenticated
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.posts p
      where p.id = post_id and public.can_moderate_salon(p.salon_id)
    )
  );

-- -----------------------------------------------------------------------------
-- reactions
-- -----------------------------------------------------------------------------
alter table public.reactions enable row level security;

drop policy if exists reactions_select on public.reactions;
create policy reactions_select on public.reactions
  for select to authenticated
  using (
    (
      post_id is not null
      and exists (
        select 1 from public.posts p
        where p.id = post_id and public.can_access_salon(p.salon_id)
      )
    )
    or (
      comment_id is not null
      and exists (
        select 1
        from public.comments c
        join public.posts p on p.id = c.post_id
        where c.id = comment_id and public.can_access_salon(p.salon_id)
      )
    )
  );

drop policy if exists reactions_insert_self on public.reactions;
create policy reactions_insert_self on public.reactions
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists reactions_update_self on public.reactions;
create policy reactions_update_self on public.reactions
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists reactions_delete_self on public.reactions;
create policy reactions_delete_self on public.reactions
  for delete to authenticated
  using (user_id = auth.uid());