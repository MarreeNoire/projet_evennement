-- =============================================================================
--  0028 — RLS : connexions et blocages (networking)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- connections
-- -----------------------------------------------------------------------------
alter table public.connections enable row level security;

drop policy if exists connections_select on public.connections;
create policy connections_select on public.connections
  for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- On ne peut inviter que des personnes qui acceptent les connexions
-- et qui ne nous ont pas bloqué (règles de confidentialité §16).
drop policy if exists connections_insert_self on public.connections;
create policy connections_insert_self on public.connections
  for insert to authenticated
  with check (
    requester_id = auth.uid()
    and requester_id <> addressee_id
    and not public.is_blocked_between(requester_id, addressee_id)
    and exists (
      select 1 from public.profiles p
      where p.id = addressee_id and p.allow_connections = true
    )
  );

drop policy if exists connections_update_participants on public.connections;
create policy connections_update_participants on public.connections
  for update to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid())
  with check (requester_id = auth.uid() or addressee_id = auth.uid());

drop policy if exists connections_delete_participants on public.connections;
create policy connections_delete_participants on public.connections
  for delete to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- -----------------------------------------------------------------------------
-- blocks
-- -----------------------------------------------------------------------------
alter table public.blocks enable row level security;

drop policy if exists blocks_select_own on public.blocks;
create policy blocks_select_own on public.blocks
  for select to authenticated
  using (blocker_id = auth.uid());

drop policy if exists blocks_insert_self on public.blocks;
create policy blocks_insert_self on public.blocks
  for insert to authenticated
  with check (blocker_id = auth.uid() and blocker_id <> blocked_id);

drop policy if exists blocks_delete_self on public.blocks;
create policy blocks_delete_self on public.blocks
  for delete to authenticated
  using (blocker_id = auth.uid());