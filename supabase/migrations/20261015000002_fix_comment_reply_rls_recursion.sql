-- Évite la récursion RLS quand la politique d'insertion vérifie le commentaire parent.
-- La fonction lit la table avec les droits du propriétaire et ne renvoie qu'un booléen.
create or replace function public.can_reply_to_comment(
  target_comment_id uuid,
  target_post_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.comments as parent
    where parent.id = target_comment_id
      and parent.post_id = target_post_id
      and parent.parent_id is null
      and parent.is_hidden = false
  );
$$;

revoke all on function public.can_reply_to_comment(uuid, uuid) from public;
grant execute on function public.can_reply_to_comment(uuid, uuid) to authenticated;

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
      or public.can_reply_to_comment(parent_id, post_id)
    )
  );
