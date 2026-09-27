-- Allow a connection request to a profile whose visibility is restricted.
-- The badge page may intentionally expose a signed, limited profile while the
-- normal profiles SELECT policy still hides that row from the requester.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.profile_accepts_connections(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and target_id <> auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = target_id
        and p.allow_connections = true
    );
$$;

revoke all on function private.profile_accepts_connections(uuid) from public, anon;
grant execute on function private.profile_accepts_connections(uuid) to authenticated;

drop policy if exists connections_insert_self on public.connections;
create policy connections_insert_self on public.connections
  for insert to authenticated
  with check (
    requester_id = auth.uid()
    and requester_id <> addressee_id
    and not public.is_blocked_between(requester_id, addressee_id)
    and private.profile_accepts_connections(addressee_id)
  );
