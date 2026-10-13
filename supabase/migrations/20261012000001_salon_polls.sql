-- Sondages en direct dans les salons événementiels.
-- Chaque membre du salon peut créer un sondage (2 à 6 options) et voter une fois ;
-- le vote reste modifiable tant que le sondage est ouvert. Les résultats sont
-- diffusés en temps réel via supabase_realtime.

create table if not exists public.salon_polls (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  question text not null,
  is_closed boolean not null default false,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint salon_polls_question_length check (char_length(trim(question)) between 1 and 280)
);

create index if not exists salon_polls_salon_created_idx
  on public.salon_polls (salon_id, created_at desc);

create table if not exists public.salon_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.salon_polls (id) on delete cascade,
  label text not null,
  position int not null default 0,
  constraint salon_poll_options_label_length check (char_length(trim(label)) between 1 and 120)
);

create index if not exists salon_poll_options_poll_idx
  on public.salon_poll_options (poll_id, position);

create table if not exists public.salon_poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.salon_polls (id) on delete cascade,
  option_id uuid not null references public.salon_poll_options (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

create index if not exists salon_poll_votes_poll_idx
  on public.salon_poll_votes (poll_id);
create index if not exists salon_poll_votes_option_idx
  on public.salon_poll_votes (option_id);

alter table public.salon_polls enable row level security;
alter table public.salon_poll_options enable row level security;
alter table public.salon_poll_votes enable row level security;

create policy salon_polls_select on public.salon_polls
  for select to authenticated
  using (public.can_access_salon(salon_id));

create policy salon_polls_insert on public.salon_polls
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.can_access_salon(salon_id)
    and is_closed = false
  );

-- Clôture : auteur ou modérateur. La clause with check empêche de rouvrir.
create policy salon_polls_update on public.salon_polls
  for update to authenticated
  using (
    public.can_access_salon(salon_id)
    and (author_id = auth.uid() or public.can_moderate_salon(salon_id))
  )
  with check (
    public.can_access_salon(salon_id)
    and (author_id = auth.uid() or public.can_moderate_salon(salon_id))
  );

create policy salon_polls_delete on public.salon_polls
  for delete to authenticated
  using (
    public.can_access_salon(salon_id)
    and (author_id = auth.uid() or public.can_moderate_salon(salon_id))
  );

create policy salon_poll_options_select on public.salon_poll_options
  for select to authenticated
  using (
    exists (
      select 1 from public.salon_polls poll
      where poll.id = poll_id and public.can_access_salon(poll.salon_id)
    )
  );

create policy salon_poll_options_insert on public.salon_poll_options
  for insert to authenticated
  with check (
    exists (
      select 1 from public.salon_polls poll
      where poll.id = poll_id
        and poll.author_id = auth.uid()
        and public.can_access_salon(poll.salon_id)
    )
  );

create policy salon_poll_options_delete on public.salon_poll_options
  for delete to authenticated
  using (
    exists (
      select 1 from public.salon_polls poll
      where poll.id = poll_id
        and (poll.author_id = auth.uid() or public.can_moderate_salon(poll.salon_id))
    )
  );

create policy salon_poll_votes_select on public.salon_poll_votes
  for select to authenticated
  using (
    exists (
      select 1 from public.salon_polls poll
      where poll.id = poll_id and public.can_access_salon(poll.salon_id)
    )
  );

-- Un vote ne peut être inséré que sur un sondage ouvert, dans ce salon,
-- par son auteur, sur une option appartenant bien au sondage.
create policy salon_poll_votes_insert on public.salon_poll_votes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.salon_polls poll
      where poll.id = poll_id
        and poll.is_closed = false
        and public.can_access_salon(poll.salon_id)
    )
    and exists (
      select 1 from public.salon_poll_options option
      where option.id = option_id and option.poll_id = salon_poll_votes.poll_id
    )
  );

-- Changer d'avis : l'électeur peut déplacer son vote tant que le sondage est ouvert.
create policy salon_poll_votes_update on public.salon_poll_votes
  for update to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.salon_polls poll
      where poll.id = poll_id
        and poll.is_closed = false
        and public.can_access_salon(poll.salon_id)
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.salon_polls poll
      where poll.id = poll_id
        and poll.is_closed = false
        and public.can_access_salon(poll.salon_id)
    )
    and exists (
      select 1 from public.salon_poll_options option
      where option.id = option_id and option.poll_id = salon_poll_votes.poll_id
    )
  );

create policy salon_poll_votes_delete on public.salon_poll_votes
  for delete to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.salon_polls poll
      where poll.id = poll_id
        and poll.is_closed = false
        and public.can_access_salon(poll.salon_id)
    )
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'salon_polls'
  ) then
    alter publication supabase_realtime add table public.salon_polls;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'salon_poll_options'
  ) then
    alter publication supabase_realtime add table public.salon_poll_options;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'salon_poll_votes'
  ) then
    alter publication supabase_realtime add table public.salon_poll_votes;
  end if;
end
$$;
