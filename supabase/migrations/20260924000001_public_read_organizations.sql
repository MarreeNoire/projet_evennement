-- =============================================================================
--  0035 — Lecture publique restreinte des organisations
--  --------------------------------------------------------------------------
--  Problème : la vue `published_events` est en `security_invoker = true` et
--  fait une jointure sur `organizations`. Or la seule policy SELECT de
--  `organizations` (cf. 0021) est réservée au rôle `authenticated`.
--  Un visiteur non connecté (rôle `anon`) ne voit donc AUCUNE organisation,
--  et la jointure renvoie 0 événement : « Explorer » reste vide, même pour
--  des événements bien publiés.
--
--  Correctif : autoriser `anon` à lire les organisations actives, mais
--  uniquement sur les colonnes publiques (le RLS filtre les lignes, pas les
--  colonnes : sans le GRANT par colonnes, email, téléphone et owner_id
--  seraient lisibles par n'importe qui via l'API).
-- =============================================================================

drop policy if exists organizations_select_anon on public.organizations;
create policy organizations_select_anon on public.organizations
  for select to anon
  using (is_active = true);

revoke select on public.organizations from anon;

grant select (
  id,
  name,
  slug,
  description,
  logo_url,
  cover_url,
  website,
  city,
  country,
  is_verified,
  is_active
) on public.organizations to anon;
