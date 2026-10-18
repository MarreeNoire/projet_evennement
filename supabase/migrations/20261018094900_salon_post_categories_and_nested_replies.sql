-- Étiquettes de publication et autorisation des discussions imbriquées.
alter table public.posts
  add column if not exists category text not null default 'discussion';

alter table public.posts
  drop constraint if exists posts_category_check;

alter table public.posts
  add constraint posts_category_check
  check (category in ('discussion', 'question', 'info_pratique', 'rencontre', 'covoiturage', 'photo'));

create index if not exists posts_salon_category_idx
  on public.posts (salon_id, category, created_at desc)
  where is_hidden = false;

comment on column public.posts.category is
  'Étiquette de navigation du fil du salon.';

-- La fonction SECURITY DEFINER évite une récursion RLS en lisant le parent.
-- Autorise toute profondeur, tant que le commentaire parent appartient au
-- même post et reste visible.
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
