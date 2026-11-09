-- =============================================================================
--  Correctif complémentaire — privileges d'écriture anonymes
-- -----------------------------------------------------------------------------
--  La révocation de la colonne `profiles.email` ne suffit pas tant que `anon`
--  conserve un GRANT UPDATE au niveau table : PostgreSQL accorde alors l'écriture
--  sur toutes les colonnes. Les politiques RLS bloquent déjà l'anonyme, mais on
--  retire aussi le privilège pour une défense en profondeur.
-- =============================================================================

begin;

revoke insert, update, delete on public.profiles from anon;

commit;
