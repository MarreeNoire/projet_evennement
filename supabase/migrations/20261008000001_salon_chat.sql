-- Chat temps réel propre à chaque salon événementiel.
create table if not exists public.salon_chat_messages (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  reply_to uuid references public.salon_chat_messages (id) on delete set null,
  content text not null,
  edited_at timestamptz,
  is_hidden boolean not null default false,
  hidden_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint salon_chat_messages_content_length check (
    char_length(trim(content)) between 1 and 4000
  )
);

create index if not exists salon_chat_messages_salon_created_idx
  on public.salon_chat_messages (salon_id, created_at desc);
create index if not exists salon_chat_messages_reply_idx
  on public.salon_chat_messages (reply_to) where reply_to is not null;

create table if not exists public.salon_chat_reactions (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  message_id uuid not null references public.salon_chat_messages (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reaction text not null check (reaction in ('heart', 'laugh', 'fire', 'clap', 'wow')),
  created_at timestamptz not null default now(),
  unique (message_id, user_id, reaction)
);

create index if not exists salon_chat_reactions_message_idx
  on public.salon_chat_reactions (message_id);

alter table public.salon_chat_messages enable row level security;
alter table public.salon_chat_reactions enable row level security;

create policy salon_chat_messages_select on public.salon_chat_messages
  for select to authenticated
  using (
    public.can_access_salon(salon_id)
    and (is_hidden = false or public.can_moderate_salon(salon_id))
  );

create policy salon_chat_messages_insert on public.salon_chat_messages
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.can_access_salon(salon_id)
    and (
      reply_to is null
      or exists (
        select 1 from public.salon_chat_messages parent
        where parent.id = reply_to
          and parent.salon_id = salon_chat_messages.salon_id
          and parent.is_hidden = false
      )
    )
  );

create policy salon_chat_messages_update on public.salon_chat_messages
  for update to authenticated
  using (
    public.can_moderate_salon(salon_id)
    or (
      public.can_access_salon(salon_id)
      and author_id = auth.uid()
    )
  )
  with check (
    public.can_moderate_salon(salon_id)
    or (
      public.can_access_salon(salon_id)
      and author_id = auth.uid()
      and is_hidden = false
    )
  );

create policy salon_chat_messages_delete on public.salon_chat_messages
  for delete to authenticated
  using (
    public.can_moderate_salon(salon_id)
    or (public.can_access_salon(salon_id) and author_id = auth.uid())
  );

create policy salon_chat_reactions_select on public.salon_chat_reactions
  for select to authenticated
  using (public.can_access_salon(salon_id));

create policy salon_chat_reactions_insert on public.salon_chat_reactions
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.can_access_salon(salon_id)
    and exists (
      select 1 from public.salon_chat_messages message
      where message.id = message_id
        and message.salon_id = salon_chat_reactions.salon_id
        and message.is_hidden = false
    )
  );

create policy salon_chat_reactions_delete on public.salon_chat_reactions
  for delete to authenticated
  using (
    public.can_access_salon(salon_id)
    and (user_id = auth.uid() or public.can_moderate_salon(salon_id))
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'salon_chat_messages'
  ) then
    alter publication supabase_realtime add table public.salon_chat_messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'salon_chat_reactions'
  ) then
    alter publication supabase_realtime add table public.salon_chat_reactions;
  end if;
end
$$;
