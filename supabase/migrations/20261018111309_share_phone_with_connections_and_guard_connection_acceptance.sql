begin;

-- Le partage du numéro est individuel pour chaque connexion acceptée.
create table if not exists public.connection_contact_shares (
  connection_id uuid not null references public.connections (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (connection_id, owner_id)
);

alter table public.connection_contact_shares enable row level security;
revoke all on public.connection_contact_shares from public, anon, authenticated;
grant select, insert, delete on public.connection_contact_shares to authenticated;
grant all on public.connection_contact_shares to service_role;

drop policy if exists connection_contact_shares_select_pair on public.connection_contact_shares;
create policy connection_contact_shares_select_pair on public.connection_contact_shares
  for select to authenticated
  using (
    exists (
      select 1 from public.connections c
      where c.id = connection_id
        and c.status = 'accepted'
        and (c.requester_id = (select auth.uid()) or c.addressee_id = (select auth.uid()))
    )
  );

drop policy if exists connection_contact_shares_insert_owner on public.connection_contact_shares;
create policy connection_contact_shares_insert_owner on public.connection_contact_shares
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.connections c
      where c.id = connection_id
        and c.status = 'accepted'
        and (c.requester_id = (select auth.uid()) or c.addressee_id = (select auth.uid()))
    )
  );

drop policy if exists connection_contact_shares_delete_owner on public.connection_contact_shares;
create policy connection_contact_shares_delete_owner on public.connection_contact_shares
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Un téléphone n'est lisible par l'autre membre que si son propriétaire a
-- explicitement partagé avec cette relation précise.
drop policy if exists profile_contacts_select_self on public.profile_contacts;
create policy profile_contacts_select_self on public.profile_contacts
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.connections c
      join public.connection_contact_shares s on s.connection_id = c.id
      where c.status = 'accepted'
        and s.owner_id = profile_contacts.user_id
        and ((c.requester_id = (select auth.uid()) and c.addressee_id = profile_contacts.user_id)
          or (c.addressee_id = (select auth.uid()) and c.requester_id = profile_contacts.user_id))
    )
  );

-- Empêche un demandeur de s'auto-accepter ou de réécrire les deux membres
-- d'une connexion pour contourner le consentement privé.
create or replace function public.guard_connection_acceptance()
returns trigger
language plpgsql
set search_path = public, auth
as $$
begin
  if new.requester_id is distinct from old.requester_id
    or new.addressee_id is distinct from old.addressee_id
    or new.message is distinct from old.message
    or new.origin is distinct from old.origin
    or new.event_id is distinct from old.event_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Les membres et les détails d’une demande sont immuables.';
  end if;

  if auth.uid() is not null and auth.uid() <> old.addressee_id then
    raise exception 'Seul le destinataire peut répondre à cette demande.';
  end if;

  if old.status <> 'pending' or new.status not in ('accepted', 'declined') then
    raise exception 'Cette demande ne peut plus être modifiée.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_connection_acceptance on public.connections;
create trigger guard_connection_acceptance
  before update on public.connections
  for each row execute function public.guard_connection_acceptance();

drop policy if exists connections_update_participants on public.connections;
drop policy if exists connections_update_addressee_pending on public.connections;
create policy connections_update_addressee_pending on public.connections
  for update to authenticated
  using (addressee_id = (select auth.uid()) and status = 'pending')
  with check (
    addressee_id = (select auth.uid())
    and status in ('accepted', 'declined')
  );

commit;
