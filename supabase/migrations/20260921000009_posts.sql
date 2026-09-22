-- =============================================================================
--  0009 — Fil de discussion : publications et commentaires
-- =============================================================================

-- -----------------------------------------------------------------------------
-- posts : publication dans un salon (fil de discussion, pas un simple chat)
-- -----------------------------------------------------------------------------
create table if not exists public.posts (
  id               uuid primary key default gen_random_uuid(),
  salon_id         uuid not null references public.salons (id) on delete cascade,
  author_id        uuid references public.profiles (id) on delete set null,
  kind             public.post_kind not null default 'post',
  content          text not null,
  media            jsonb not null default '[]'::jsonb,
  mentions         uuid[] not null default '{}',
  reaction_count   integer not null default 0,
  comment_count    integer not null default 0,
  is_pinned        boolean not null default false,
  is_hidden        boolean not null default false,
  hidden_by        uuid references public.profiles (id) on delete set null,
  hidden_reason    text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint posts_content_length check (
    char_length(content) between 1 and 5000
  ),
  constraint posts_media_array check (jsonb_typeof(media) = 'array'),
  constraint posts_announcement_requires_author check (
    kind = 'post' or author_id is not null
  )
);

comment on table public.posts is 'Publication du fil de discussion d''un salon.';
comment on column public.posts.kind is
  'post = publication d''un membre, announcement = annonce officielle de l''organisateur.';
comment on column public.posts.mentions is
  'Identifiants des utilisateurs mentionnés, utilisés pour les notifications.';
comment on column public.posts.media is
  'Médias attachés : [{ url, kind, width, height, duration }].';
comment on column public.posts.is_hidden is
  'Masquée par la modération : invisible pour les membres, visible pour les modérateurs.';

create index if not exists posts_salon_idx on public.posts (salon_id, is_pinned desc, created_at desc);
create index if not exists posts_author_idx on public.posts (author_id, created_at desc);
create index if not exists posts_announcement_idx on public.posts (salon_id, kind)
  where kind = 'announcement';

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- comments : réponses et commentaires imbriqués
-- -----------------------------------------------------------------------------
create table if not exists public.comments (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references public.posts (id) on delete cascade,
  parent_id     uuid references public.comments (id) on delete cascade,
  author_id     uuid references public.profiles (id) on delete set null,
  content       text not null,
  mentions      uuid[] not null default '{}',
  reaction_count integer not null default 0,
  is_hidden     boolean not null default false,
  hidden_by     uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint comments_content_length check (char_length(content) between 1 and 2000)
);

comment on table public.comments is 'Commentaire ou réponse sous une publication.';

create index if not exists comments_post_idx on public.comments (post_id, created_at);
create index if not exists comments_parent_idx on public.comments (parent_id);
create index if not exists comments_author_idx on public.comments (author_id, created_at desc);

drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- reactions : réactions sur publications et commentaires
-- -----------------------------------------------------------------------------
create table if not exists public.reactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  post_id       uuid references public.posts (id) on delete cascade,
  comment_id    uuid references public.comments (id) on delete cascade,
  reaction      public.reaction_type not null default 'like',
  created_at    timestamptz not null default now(),

  constraint reactions_single_target check (
    (post_id is not null and comment_id is null)
    or (post_id is null and comment_id is not null)
  )
);

comment on table public.reactions is 'Réaction d''un utilisateur sur une publication ou un commentaire.';

-- Une seule réaction par utilisateur et par cible.
create unique index if not exists reactions_user_post_key
  on public.reactions (user_id, post_id) where post_id is not null;
create unique index if not exists reactions_user_comment_key
  on public.reactions (user_id, comment_id) where comment_id is not null;
create index if not exists reactions_post_idx on public.reactions (post_id);
create index if not exists reactions_comment_idx on public.reactions (comment_id);