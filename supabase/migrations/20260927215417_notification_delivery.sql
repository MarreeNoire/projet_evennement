-- Deliver the notification types already exposed by the product UI.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.emit_notification(
  p_user_id uuid,
  p_type public.notification_type,
  p_title text,
  p_body text default null,
  p_url text default null,
  p_actor_id uuid default null,
  p_event_id uuid default null,
  p_salon_id uuid default null,
  p_post_id uuid default null,
  p_conversation_id uuid default null,
  p_entity_type text default null,
  p_entity_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null or p_user_id = p_actor_id then
    return;
  end if;

  if exists (
    select 1
    from public.notification_preferences preference
    where preference.user_id = p_user_id
      and preference.type = p_type
      and preference.in_app = false
  ) then
    return;
  end if;

  insert into public.notifications (
    user_id, type, title, body, url, actor_id, event_id, salon_id,
    post_id, conversation_id, entity_type, entity_id
  ) values (
    p_user_id, p_type, p_title, p_body, p_url, p_actor_id, p_event_id,
    p_salon_id, p_post_id, p_conversation_id, p_entity_type, p_entity_id
  );
end;
$$;

create or replace function private.notify_connection_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_name text;
begin
  select coalesce(profile.display_name, 'Un participant')
    into actor_name
  from public.profiles profile
  where profile.id = case when tg_op = 'INSERT' then new.requester_id else new.addressee_id end;

  if tg_op = 'INSERT' then
    perform private.emit_notification(
      new.addressee_id, 'connection_request', 'Nouvelle demande de connexion',
      actor_name || ' souhaite se connecter avec toi.', '/connexions',
      new.requester_id, new.event_id, null, null, null, 'connection', new.id
    );
  elsif old.status = 'pending' and new.status = 'accepted' then
    perform private.emit_notification(
      new.requester_id, 'connection_accepted', 'Demande de connexion acceptée',
      actor_name || ' a accepté ta demande de connexion.', '/connexions',
      new.addressee_id, new.event_id, null, null, null, 'connection', new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists notifications_on_connection_insert on public.connections;
create trigger notifications_on_connection_insert
  after insert on public.connections
  for each row execute function private.notify_connection_change();

drop trigger if exists notifications_on_connection_accept on public.connections;
create trigger notifications_on_connection_accept
  after update of status on public.connections
  for each row when (old.status is distinct from new.status)
  execute function private.notify_connection_change();

create or replace function private.notify_post_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  salon_slug text;
  salon_name text;
  actor_name text;
  recipient record;
  mention_user uuid;
  notification_kind public.notification_type;
  notification_title text;
begin
  select salon.slug, salon.name into salon_slug, salon_name
  from public.salons salon where salon.id = new.salon_id;
  select coalesce(profile.display_name, 'Un participant') into actor_name
  from public.profiles profile where profile.id = new.author_id;

  if new.kind = 'announcement' then
    notification_kind := 'organizer_announcement';
    notification_title := 'Nouvelle annonce dans ' || coalesce(salon_name, 'un salon');
  else
    notification_kind := 'new_salon_post';
    notification_title := 'Nouvelle publication dans ' || coalesce(salon_name, 'un salon');
  end if;

  for recipient in
    select member.user_id
    from public.salon_members member
    where member.salon_id = new.salon_id
      and member.user_id <> coalesce(new.author_id, '00000000-0000-0000-0000-000000000000'::uuid)
      and member.left_at is null
      and member.is_muted = false
  loop
    perform private.emit_notification(
      recipient.user_id, notification_kind, notification_title,
      actor_name || ' : ' || left(new.content, 180),
      '/salons/' || new.salon_id::text,
      new.author_id, null, new.salon_id, new.id, null, 'post', new.id
    );
  end loop;

  foreach mention_user in array new.mentions
  loop
    perform private.emit_notification(
      mention_user, 'mention', 'Tu as été mentionné dans une publication',
      actor_name || ' t’a mentionné dans ' || coalesce(salon_name, 'un salon') || '.',
      '/salons/' || new.salon_id::text,
      new.author_id, null, new.salon_id, new.id, null, 'post', new.id
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists notifications_on_post_created on public.posts;
create trigger notifications_on_post_created
  after insert on public.posts
  for each row execute function private.notify_post_created();

create or replace function private.notify_comment_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  post_author uuid;
  parent_author uuid;
  salon_id uuid;
  salon_slug text;
  salon_name text;
  actor_name text;
  recipient uuid;
  mention_user uuid;
begin
  select post.author_id, post.salon_id, salon.slug, salon.name
    into post_author, salon_id, salon_slug, salon_name
  from public.posts post
  join public.salons salon on salon.id = post.salon_id
  where post.id = new.post_id;

  if new.parent_id is not null then
    select comment.author_id into parent_author
    from public.comments comment where comment.id = new.parent_id;
  end if;
  select coalesce(profile.display_name, 'Un participant') into actor_name
  from public.profiles profile where profile.id = new.author_id;

  recipient := coalesce(parent_author, post_author);
  perform private.emit_notification(
    recipient, 'post_reply', 'Nouvelle réponse dans ' || coalesce(salon_name, 'un salon'),
    actor_name || ' : ' || left(new.content, 180),
    '/salons/' || salon_id::text,
    new.author_id, null, salon_id, new.post_id, null, 'comment', new.id
  );

  foreach mention_user in array new.mentions
  loop
    perform private.emit_notification(
      mention_user, 'mention', 'Tu as été mentionné dans une réponse',
      actor_name || ' t’a mentionné dans ' || coalesce(salon_name, 'un salon') || '.',
      '/salons/' || salon_id::text,
      new.author_id, null, salon_id, new.post_id, null, 'comment', new.id
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists notifications_on_comment_created on public.comments;
create trigger notifications_on_comment_created
  after insert on public.comments
  for each row execute function private.notify_comment_created();

create or replace function private.notify_new_salon_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  salon_name text;
  salon_slug text;
  actor_name text;
  recipient record;
begin
  select salon.name, salon.slug into salon_name, salon_slug
  from public.salons salon where salon.id = new.salon_id;
  select coalesce(profile.display_name, 'Un participant') into actor_name
  from public.profiles profile where profile.id = new.user_id;

  for recipient in
    select member.user_id
    from public.salon_members member
    where member.salon_id = new.salon_id and member.user_id <> new.user_id
      and member.left_at is null and member.is_muted = false
  loop
    perform private.emit_notification(
      recipient.user_id, 'new_member', 'Nouveau participant dans ' || coalesce(salon_name, 'un salon'),
      actor_name || ' a rejoint le salon.', '/salons/' || new.salon_id::text,
      new.user_id, null, new.salon_id, null, null, 'salon_member', new.id
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists notifications_on_salon_member_inserted on public.salon_members;
create trigger notifications_on_salon_member_inserted
  after insert on public.salon_members
  for each row when (new.left_at is null)
  execute function private.notify_new_salon_member();

drop trigger if exists notifications_on_salon_member_rejoined on public.salon_members;
create trigger notifications_on_salon_member_rejoined
  after update of left_at on public.salon_members
  for each row when (old.left_at is not null and new.left_at is null)
  execute function private.notify_new_salon_member();

create or replace function private.notify_message_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_name text;
  recipient record;
begin
  select coalesce(profile.display_name, 'Un participant') into actor_name
  from public.profiles profile where profile.id = new.sender_id;

  for recipient in
    select participant.user_id
    from public.conversation_participants participant
    where participant.conversation_id = new.conversation_id
      and participant.user_id <> coalesce(new.sender_id, '00000000-0000-0000-0000-000000000000'::uuid)
      and participant.is_archived = false
  loop
    perform private.emit_notification(
      recipient.user_id, 'message', 'Nouveau message de ' || actor_name,
      coalesce(nullif(left(new.content, 180), ''), 'T’a envoyé une pièce jointe.'),
      '/connexions', new.sender_id, null, null, null, new.conversation_id,
      'message', new.id
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists notifications_on_message_created on public.messages;
create trigger notifications_on_message_created
  after insert on public.messages
  for each row when (new.is_hidden = false)
  execute function private.notify_message_created();

create or replace function private.notify_event_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient record;
  event_url text := '/evenements/' || new.slug;
  event_change text;
begin
  event_change := case
    when old.status is distinct from new.status and new.status = 'cancelled' then 'L’événement a été annulé.'
    when old.start_at is distinct from new.start_at then 'L’horaire de l’événement a changé.'
    when old.venue_name is distinct from new.venue_name or old.address is distinct from new.address
      or old.city is distinct from new.city then 'Le lieu de l’événement a changé.'
    else 'Les informations de l’événement ont été mises à jour.'
  end;

  for recipient in
    select distinct ticket.user_id
    from public.tickets ticket
    where ticket.event_id = new.id and ticket.status in ('paid', 'used')
  loop
    perform private.emit_notification(
      recipient.user_id, 'event_update', 'Mise à jour : ' || new.title,
      event_change, event_url, null, new.id, null, null, null, 'event', new.id
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists notifications_on_event_update on public.events;
create trigger notifications_on_event_update
  after update of title, summary, start_at, end_at, venue_name, address, city, online_url, status
  on public.events
  for each row when (
    old.title is distinct from new.title or old.summary is distinct from new.summary
    or old.start_at is distinct from new.start_at or old.end_at is distinct from new.end_at
    or old.venue_name is distinct from new.venue_name or old.address is distinct from new.address
    or old.city is distinct from new.city or old.online_url is distinct from new.online_url
    or old.status is distinct from new.status
  )
  execute function private.notify_event_updated();

create or replace function private.notify_report_resolved()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.reporter_id is not null and new.status in ('resolved', 'dismissed') then
    perform private.emit_notification(
      new.reporter_id, 'report_resolved', 'Ton signalement a été traité',
      coalesce(nullif(new.resolution, ''), 'Notre équipe a terminé l’examen de ton signalement.'),
      '/notifications', new.reviewed_by, new.event_id, new.salon_id, null, null,
      'report', new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists notifications_on_report_resolved on public.reports;
create trigger notifications_on_report_resolved
  after update of status on public.reports
  for each row when (
    old.status is distinct from new.status
    and old.status not in ('resolved', 'dismissed')
    and new.status in ('resolved', 'dismissed')
  )
  execute function private.notify_report_resolved();

create or replace function private.dispatch_event_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  attendee record;
  event_title text;
  reminder_count integer := 0;
begin
  for attendee in
    select distinct event.id as event_id, event.slug, event.title, ticket.user_id
    from public.events event
    join public.tickets ticket on ticket.event_id = event.id
    where event.status = 'published'
      and event.start_at > now() + interval '23 hours'
      and event.start_at <= now() + interval '25 hours'
      and ticket.status in ('paid', 'used')
      and not exists (
        select 1 from public.notifications notification
        where notification.user_id = ticket.user_id
          and notification.event_id = event.id
          and notification.type = 'event_reminder'
      )
  loop
    event_title := attendee.title;
    perform private.emit_notification(
      attendee.user_id, 'event_reminder', 'Rappel : ' || event_title,
      'Ton événement commence demain.', '/evenements/' || attendee.slug,
      null, attendee.event_id, null, null, null, 'event', attendee.event_id
    );
    if not exists (
      select 1 from public.notification_preferences preference
      where preference.user_id = attendee.user_id
        and preference.type = 'event_reminder' and preference.in_app = false
    ) then
      reminder_count := reminder_count + 1;
    end if;
  end loop;
  return reminder_count;
end;
$$;

revoke all on function private.emit_notification(uuid, public.notification_type, text, text, text, uuid, uuid, uuid, uuid, uuid, text, uuid) from public, anon, authenticated;
revoke all on function private.notify_connection_change() from public, anon, authenticated;
revoke all on function private.notify_post_created() from public, anon, authenticated;
revoke all on function private.notify_comment_created() from public, anon, authenticated;
revoke all on function private.notify_new_salon_member() from public, anon, authenticated;
revoke all on function private.notify_message_created() from public, anon, authenticated;
revoke all on function private.notify_event_updated() from public, anon, authenticated;
revoke all on function private.notify_report_resolved() from public, anon, authenticated;
revoke all on function private.dispatch_event_reminders() from public, anon, authenticated;

-- Supabase exposes pg_cron as a supported extension; run hourly and use a two-hour
-- window plus a per-user/event existence check to avoid missed or duplicate reminders.
create extension if not exists pg_cron;
do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname = 'notification-event-reminders-hourly';
  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;
  perform cron.schedule(
    'notification-event-reminders-hourly',
    '0 * * * *',
    'select private.dispatch_event_reminders();'
  );
end;
$$;

-- Expose only the signed-in user's counter; callers can no longer pass another user ID.
drop function if exists public.unread_notification_count(uuid);
create or replace function public.unread_notification_count()
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*)::integer
  from public.notifications
  where user_id = (select auth.uid()) and is_read = false;
$$;
revoke all on function public.unread_notification_count() from public, anon;
grant execute on function public.unread_notification_count() to authenticated;

comment on function public.unread_notification_count() is
  'Nombre de notifications non lues de la session courante, filtré par RLS.';
