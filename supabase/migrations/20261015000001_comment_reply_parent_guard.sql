-- Autorise les réponses aux commentaires de la même publication uniquement.
-- Les réponses restent à un niveau d'imbrication pour garder le fil lisible.
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
    and (
      parent_id is null
      or exists (
        select 1 from public.comments parent
        where parent.id = comments.parent_id
          and parent.post_id = comments.post_id
          and parent.parent_id is null
          and parent.is_hidden = false
      )
    )
  );
