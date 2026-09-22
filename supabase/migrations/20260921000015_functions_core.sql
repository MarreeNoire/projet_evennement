-- =============================================================================
--  0015 — Fonctions cœur : amorçage utilisateur, compteurs, accès aux salons
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Amorçage automatique à l'inscription (auth.users -> profiles + rôle + préférences)
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, full_name, email, phone, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, 'membre'), '@', 1),
      'Nouveau membre'
    ),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    new.phone,
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'participant')
  on conflict (user_id, role) do nothing;

  perform public.seed_notification_preferences(new.id);

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Crée le profil, le rôle participant et les préférences de notification à l''inscription.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Compteurs dénormalisés (évitent des COUNT(*) coûteux sur les écrans de salon)
-- -----------------------------------------------------------------------------
create or replace function public.sync_salon_post_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.salons set post_count = post_count + 1 where id = new.salon_id;
  elsif tg_op = 'DELETE' then
    update public.salons set post_count = greatest(post_count - 1, 0) where id = old.salon_id;
  end if;
  return null;
end;
$$;

drop trigger if exists posts_sync_salon_count on public.posts;
create trigger posts_sync_salon_count
  after insert or delete on public.posts
  for each row execute function public.sync_salon_post_count();

create or replace function public.sync_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists comments_sync_post_count on public.comments;
create trigger comments_sync_post_count
  after insert or delete on public.comments
  for each row execute function public.sync_post_comment_count();

create or replace function public.sync_reaction_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  delta integer := case when tg_op = 'INSERT' then 1 else -1 end;
  target_post uuid := coalesce(new.post_id, old.post_id);
  target_comment uuid := coalesce(new.comment_id, old.comment_id);
begin
  if target_post is not null then
    update public.posts
    set reaction_count = greatest(reaction_count + delta, 0)
    where id = target_post;
  elsif target_comment is not null then
    update public.comments
    set reaction_count = greatest(reaction_count + delta, 0)
    where id = target_comment;
  end if;
  return null;
end;
$$;

drop trigger if exists reactions_sync_count on public.reactions;
create trigger reactions_sync_count
  after insert or delete on public.reactions
  for each row execute function public.sync_reaction_count();

create or replace function public.sync_salon_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.left_at is null then
    update public.salons set member_count = member_count + 1 where id = new.salon_id;
  elsif tg_op = 'DELETE' and old.left_at is null then
    update public.salons set member_count = greatest(member_count - 1, 0) where id = old.salon_id;
  elsif tg_op = 'UPDATE' then
    if old.left_at is null and new.left_at is not null then
      update public.salons set member_count = greatest(member_count - 1, 0) where id = new.salon_id;
    elsif old.left_at is not null and new.left_at is null then
      update public.salons set member_count = member_count + 1 where id = new.salon_id;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists salon_members_sync_count on public.salon_members;
create trigger salon_members_sync_count
  after insert or update or delete on public.salon_members
  for each row execute function public.sync_salon_member_count();

create or replace function public.sync_album_media_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.album_id is not null then
    update public.albums set media_count = media_count + 1 where id = new.album_id;
  elsif tg_op = 'DELETE' and old.album_id is not null then
    update public.albums set media_count = greatest(media_count - 1, 0) where id = old.album_id;
  end if;
  return null;
end;
$$;

drop trigger if exists media_sync_album_count on public.media;
create trigger media_sync_album_count
  after insert or delete on public.media
  for each row execute function public.sync_album_media_count();