begin;

create table if not exists public.connection_contact_requests (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections (id) on delete cascade,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  status public.connection_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint connection_contact_requests_distinct_users check (requester_id <> recipient_id)
);

create unique index if not exists connection_contact_requests_one_pending
  on public.connection_contact_requests (connection_id)
  where status = 'pending';
create index if not exists connection_contact_requests_recipient_idx
  on public.connection_contact_requests (recipient_id, status, created_at desc);

alter table public.connection_contact_requests enable row level security;
revoke all on public.connection_contact_requests from public, anon, authenticated;
grant select, insert, update on public.connection_contact_requests to authenticated;
grant all on public.connection_contact_requests to service_role;

drop policy if exists connection_contact_requests_select_pair on public.connection_contact_requests;
create policy connection_contact_requests_select_pair on public.connection_contact_requests
  for select to authenticated
  using (
    (requester_id = (select auth.uid()) or recipient_id = (select auth.uid()))
    and exists (
      select 1 from public.connections c
      where c.id = connection_id and c.status = 'accepted'
    )
  );

drop policy if exists connection_contact_requests_insert_requester on public.connection_contact_requests;
create policy connection_contact_requests_insert_requester on public.connection_contact_requests
  for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and exists (
      select 1 from public.connections c
      where c.id = connection_id
        and c.status = 'accepted'
        and ((c.requester_id = (select auth.uid()) and c.addressee_id = recipient_id)
          or (c.addressee_id = (select auth.uid()) and c.requester_id = recipient_id))
    )
  );

drop policy if exists connection_contact_requests_update_recipient on public.connection_contact_requests;
create policy connection_contact_requests_update_recipient on public.connection_contact_requests
  for update to authenticated
  using (recipient_id = (select auth.uid()) and status = 'pending')
  with check (
    recipient_id = (select auth.uid())
    and status in ('accepted', 'declined')
  );

create or replace function public.guard_connection_contact_request_update()
returns trigger
language plpgsql
set search_path = public, auth
as $$
begin
  if new.connection_id is distinct from old.connection_id
    or new.requester_id is distinct from old.requester_id
    or new.recipient_id is distinct from old.recipient_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Les participants de la demande sont immuables.';
  end if;

  if auth.uid() is not null and auth.uid() <> old.recipient_id then
    raise exception 'Seul le destinataire peut répondre à cette demande.';
  end if;

  if old.status <> 'pending' or new.status not in ('accepted', 'declined') then
    raise exception 'Cette demande ne peut plus être modifiée.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_connection_contact_request_update on public.connection_contact_requests;
create trigger guard_connection_contact_request_update
  before update on public.connection_contact_requests
  for each row execute function public.guard_connection_contact_request_update();

create or replace function public.share_phone_after_contact_request_acceptance()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status = 'pending' and new.status = 'accepted' then
    insert into public.connection_contact_shares (connection_id, owner_id)
    values (new.connection_id, new.recipient_id)
    on conflict (connection_id, owner_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists share_phone_after_contact_request_acceptance on public.connection_contact_requests;
create trigger share_phone_after_contact_request_acceptance
  after update of status on public.connection_contact_requests
  for each row execute function public.share_phone_after_contact_request_acceptance();

create or replace function private.notify_connection_contact_request_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_name text;
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null and auth.uid() <> new.requester_id then
      raise exception 'Seul le demandeur peut envoyer cette demande.';
    end if;
    select coalesce(profile.display_name, 'Un participant') into actor_name
    from public.profiles profile where profile.id = new.requester_id;
    perform private.emit_notification(
      new.recipient_id, 'connection_request', 'Demande de numéro',
      actor_name || ' souhaite recevoir ton numéro de téléphone.', '/connexions',
      new.requester_id, null, null, null, null, 'contact_request', new.id
    );
  elsif old.status = 'pending' and new.status = 'accepted' then
    if auth.uid() is not null and auth.uid() <> new.recipient_id then
      raise exception 'Seul le destinataire peut accepter cette demande.';
    end if;
    select coalesce(profile.display_name, 'Un participant') into actor_name
    from public.profiles profile where profile.id = new.recipient_id;
    perform private.emit_notification(
      new.requester_id, 'connection_accepted', 'Numéro partagé',
      actor_name || ' a accepté ta demande et partagé son numéro avec toi.', '/connexions',
      new.recipient_id, null, null, null, null, 'contact_request', new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists notify_connection_contact_request_insert on public.connection_contact_requests;
create trigger notify_connection_contact_request_insert
  after insert on public.connection_contact_requests
  for each row execute function private.notify_connection_contact_request_change();

drop trigger if exists notify_connection_contact_request_update on public.connection_contact_requests;
create trigger notify_connection_contact_request_update
  after update of status on public.connection_contact_requests
  for each row when (old.status is distinct from new.status)
  execute function private.notify_connection_contact_request_change();

commit;
