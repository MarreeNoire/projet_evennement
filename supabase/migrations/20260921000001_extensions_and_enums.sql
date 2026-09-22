-- =============================================================================
--  0001 — Extensions, types énumérés et fonctions utilitaires
--  Plateforme événementielle & communautaire
-- =============================================================================

-- Extensions nécessaires
create extension if not exists "pg_trgm";        -- recherche floue (noms d'événements, personnes)
create extension if not exists "unaccent";       -- recherche insensible aux accents (français)
create extension if not exists "citext";         -- emails et pseudos insensibles à la casse
create extension if not exists "pgcrypto";       -- gen_random_uuid()

-- -----------------------------------------------------------------------------
-- Types énumérés (création idempotente)
-- -----------------------------------------------------------------------------
do $$
declare
  rec record;
begin
  for rec in
    select *
    from (
      values
        ('user_role',          'participant,organizer,admin'),
        ('org_role',           'owner,manager,checkin_agent,moderator'),
        ('access_level',       'standard,vip,vvip'),
        ('visibility_level',   'public,members,private'),
        ('event_status',       'draft,published,cancelled,completed'),
        ('ticket_status',      'pending,paid,cancelled,refunded,used,expired'),
        ('order_status',       'pending,paid,failed,cancelled,refunded'),
        ('payment_status',     'initiated,pending,accepted,refused,cancelled,refunded,error'),
        ('salon_privacy',      'public,members,private'),
        ('post_kind',          'post,announcement'),
        ('reaction_type',      'like,love,fire,clap,wow'),
        ('connection_status',  'pending,accepted,declined'),
        ('notification_type',  'post_reply,mention,new_salon_post,new_member,event_reminder,event_update,organizer_announcement,poll,connection_request,connection_accepted,ticket_confirmed,message,report_resolved'),
        ('report_target',      'post,comment,user,event,message'),
        ('report_reason',      'spam,harassment,hate,violence,nudity,misinformation,other'),
        ('report_status',      'open,reviewing,resolved,dismissed'),
        ('media_kind',         'image,video'),
        ('discount_kind',      'percentage,fixed'),
        ('checkin_result',     'valid,invalid,already_used,wrong_event,cancelled,refunded,unpaid')
    ) as t(type_name, type_values)
  loop
    if not exists (
      select 1
      from pg_type ty
      join pg_namespace ns on ns.oid = ty.typnamespace
      where ty.typname = rec.type_name
        and ns.nspname = 'public'
    ) then
      execute format(
        'create type public.%I as enum (%s)',
        rec.type_name,
        (
          select string_agg(quote_literal(value), ', ' order by ordinality)
          from unnest(string_to_array(rec.type_values, ',')) with ordinality as u(value, ordinality)
        )
      );
    end if;
  end loop;
end
$$;

-- -----------------------------------------------------------------------------
-- Fonctions utilitaires
-- -----------------------------------------------------------------------------

-- Met à jour automatiquement la colonne `updated_at`.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger générique : positionne updated_at à maintenant().';

-- Normalise un texte pour la recherche : minuscules, sans accents.
create or replace function public.normalize_search_text(input text)
returns text
language sql
immutable
as $$
  select lower(public.unaccent(coalesce(input, '')));
$$;

comment on function public.normalize_search_text(text) is
  'Normalise un texte pour la recherche (minuscules + suppression des accents).';

-- Recherche insensible aux accents (utilisée par les index GIN pg_trgm).
create or replace function public.immutable_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
as $$
  select public.unaccent('public.unaccent'::regdictionary, $1);
$$;

comment on function public.immutable_unaccent(text) is
  'Version IMMUTABLE de unaccent, utilisable dans un index.';

-- Arrondi monétaire FCFA : le franc CFA n''a pas de décimales.
create or replace function public.round_fcfa(amount numeric)
returns integer
language sql
immutable
as $$
  select round(coalesce(amount, 0))::integer;
$$;

comment on function public.round_fcfa(numeric) is
  'Arrondit un montant au franc CFA entier.';