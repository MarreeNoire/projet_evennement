-- =============================================================================
--  0033 — Temps réel (Supabase Realtime / WebSocket)
--  Expose les tables nécessaires à la discussion, aux notifications, aux
--  présences et aux compteurs en direct (cf. §50 du cahier).
-- =============================================================================

do $$
declare
  target_table text;
  realtime_tables text[] := array[
    'posts',
    'comments',
    'reactions',
    'media',
    'salon_members',
    'messages',
    'conversations',
    'notifications',
    'connections',
    'tickets',
    'check_ins',
    'orders'
  ];
begin
  for target_table in select unnest(realtime_tables)
  loop
    -- La publication n'accepte pas « add table if not exists » : on teste d'abord.
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = target_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target_table);
    end if;
  end loop;
end
$$;

-- La charge utile complète est nécessaire pour l'affichage direct des messages.
alter table public.messages replica identity full;
alter table public.notifications replica identity full;
alter table public.tickets replica identity full;

comment on publication supabase_realtime is
  'Tables diffusées en temps réel : discussion, notifications, présence, billets.';