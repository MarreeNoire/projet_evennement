# Audit de sécurité — Rassemble

**Date :** 9 novembre 2026  
**Périmètre :** application Next.js 16 + Supabase (`C:\Projets_informatiques\projet_evennement`)  
**Méthode :** revue statique du code, des migrations SQL/RLS, des routes API et server actions, de la configuration Next.js, de l'historique Git et des dépendances.  
**Limites :** pas de test d'intrusion, pas d'accès à la base distante. Certains constats dépendent des migrations réellement appliquées en production ; ce point est signalé quand il compte.

---

## 1. Synthèse

La posture générale est plutôt bonne : les secrets ne sont pas versionnés, les paiements sont vérifiés côté serveur, les écritures sensibles passent par `service_role`, et les RLS sont largement utilisées. Les deux failles d'élévation de privilèges identifiées ont été corrigées et appliquées sur le projet Supabase distant le 9 novembre 2026.

| # | Sévérité | Constat | Emplacement principal | Statut |
|---|----------|---------|------------------------|--------|
| 1 | **Élevée** | Un utilisateur peut se donner le rôle `owner`/`moderator` d'un salon | `20260921000025_rls_salons.sql`, `20260921000008_salons.sql` | ✅ Corrigé |
| 2 | **Élevée** | Un utilisateur peut forger une connexion déjà `accepted` et contourner le consentement | `20260927211833_fix_connections_insert_rls.sql` | ✅ Corrigé |
| 3 | Moyenne | Les adresses email des profils visibles sont lisibles par tout compte connecté | `20261014000001_private_profile_contacts.sql`, `20260921000020_rls_profiles.sql` | ✅ Corrigé |
| 4 | Moyenne | Messagerie privée possible sans connexion ni consentement (spam/harcèlement) | `20260921000030_rls_messaging.sql` | ✅ Corrigé |
| 5 | Moyenne | Rate limiting uniquement en mémoire, par instance | `src/lib/rate-limit.ts` | ⚠️ Partiel (mémoire) |
| 6 | Moyenne | CSP permissive (`unsafe-inline`, `https:` ouvert) | `next.config.ts` | ⚠️ À traiter |
| 7 | Moyenne | Migration `push_subscriptions` invalide (colonne `profiles.role` inexistante) | `20261024000001_push_subscriptions.sql` | ✅ Corrigé et appliqué |
| 8 | Faible | Un auteur peut transformer son post en annonce et l'épingler | `20260921000026_rls_posts.sql` | ✅ Corrigé |
| 9 | Faible | `ensure_event_salon()` exécutable par tout utilisateur, sans contrôle | `20260921000017_functions_event.sql` | ✅ Corrigé |
| 10 | Faible | `log_audit()` exécutable par `PUBLIC`, journal d'audit injectable | `20260921000018_functions_tickets.sql` | ✅ Corrigé |
| 11 | Faible | Fuite des emails d'invitation d'organisation | `20260921000021_rls_organizations.sql` | ✅ Corrigé |
| 12 | Faible | La clé HMAC des badges réutilise la clé `service_role` | `src/lib/social/badge-url.ts` | ⚠️ À traiter |
| 13 | Faible | GET avec effet de bord sur la page de retour de paiement | `src/app/commandes/[orderId]/retour/page.tsx` | ✅ Corrigé |
| 14 | Faible | Scripts de test avec `service_role` versionnés | `test_*.js` | ✅ Supprimés |

### État d'application — 9 novembre 2026

Les correctifs de sécurité ont été **appliqués sur le projet Supabase distant** (`vublnwwtemjyyoflnhyd`) :

| Migration | Objet |
|-----------|-------|
| `20261024000001_push_subscriptions.sql` | Table `push_subscriptions` + RLS (policy admin basée sur `user_roles`, trigger `set_updated_at`). |
| `20261027120000_team_invite_profile_search.sql` | RPC `search_team_invite_profiles`. |
| `20261028000001_security_hardening.sql` | Commandes/billets en écriture serveur, gardes `organization_members` et `profiles.is_verified`, recherche sans email. |
| `20261109000001_security_audit_fixes.sql` | Garde INSERT `salon_members`, connexions en attente, email privé, policies organisation/messagerie, gardes posts, `ensure_event_salon`, `log_audit`. |
| `20261109000002_revoke_anon_profiles_writes.sql` | Révocation des écritures anonymes sur `profiles` (défense en profondeur). |

L'historique de migration local a été réconcilié avec le distant (deux migrations renommées pour reprendre les timestamps `20261018111309` et `20261018113719`). `supabase migration list --linked` ne signale plus aucune migration en attente.

Correctifs applicatifs associés :
- `src/lib/supabase/server.ts` : l'email du profil courant vient de `user.email` (session), plus de `profiles.email`.
- `src/app/admin/utilisateurs`, `src/app/admin/utilisateurs/[id]`, `src/app/admin/journal` et `src/app/org/equipe` : lecture des emails via le client `service_role`, après contrôle d'accès.
- `src/lib/team/actions.ts` : invitations sans lecture ni stockage de l'email.
- Scripts `test_*.js` supprimés.

Restent à traiter : rate limiting partagé (Upstash), CSP plus stricte, secret HMAC dédié aux badges.

---

## 2. Constats détaillés

### 2.1 — Élevée — Escalade de privilèges dans un salon (`salon_members`)

**Fichiers :**
- `supabase/migrations/20260921000025_rls_salons.sql` (lignes 68-78)
- `supabase/migrations/20260921000008_salons.sql` (ligne 58)
- `supabase/migrations/20260921000016_functions_salon_access.sql` (lignes 55-79)

**Description :**  
La politique d'insertion permet à un utilisateur de rejoindre lui-même un salon accessible :

```sql
create policy salon_members_join_self on public.salon_members
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_access_salon(salon_id));
```

Or la colonne `role` n'est pas contrainte, et son type `public.org_role` accepte `owner`, `manager`, `checkin_agent`, `moderator`. Le trigger de durcissement `guard_salon_member_update` ne protège que les `UPDATE`, pas les `INSERT`.

**Scénario d'exploitation :**  
Un utilisateur connecté envoie directement à PostgREST :

```http
POST /rest/v1/salon_members
{ "salon_id": "<salon accessible>", "user_id": "<son uuid>", "role": "owner" }
```

La politique RLS accepte la ligne, et `can_moderate_salon()` renvoie vrai car le rôle est `owner`.

**Impact :**  
Prise de contrôle de la modération de n'importe quel salon accessible (salon public, ou salon d'un événement pour lequel on a un billet) : suppression/publication de posts, masquage, gestion des membres, épinglage, modération du chat, accès aux contenus masqués.

**Remédiation :**  
Ajouter un garde-fou `BEFORE INSERT` (et, en défense en profondeur, restreindre la politique) :

```sql
create or replace function public.guard_salon_member_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.can_moderate_salon(new.salon_id) then
    return new;
  end if;

  if new.user_id <> auth.uid() or new.role <> 'manager' then
    raise exception 'Rôle de salon non autorisé.' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists salon_members_guard_insert on public.salon_members;
create trigger salon_members_guard_insert
  before insert on public.salon_members
  for each row execute function public.guard_salon_member_insert();
```

---

### 2.2 — Élevée — Connexion forcée en statut `accepted`

**Fichiers :**
- `supabase/migrations/20260927211833_fix_connections_insert_rls.sql` (lignes 28-36)
- `supabase/migrations/20261018110821_share_phone_with_connections_and_guard_connection_acceptance.sql` (lignes 93-96)
- `supabase/migrations/20260921000020_rls_profiles.sql` (lignes 10-47)

**Description :**  
La politique d'insertion des connexions vérifie les participants mais pas le statut :

```sql
create policy connections_insert_self on public.connections
  for insert to authenticated
  with check (
    requester_id = auth.uid()
    and requester_id <> addressee_id
    and not public.is_blocked_between(requester_id, addressee_id)
    and private.profile_accepts_connections(addressee_id)
  );
```

Le statut par défaut est `pending`, mais un client peut fournir explicitement `status: "accepted"`. Le trigger `guard_connection_acceptance` ne s'exécute qu'en `BEFORE UPDATE`.

**Scénario d'exploitation :**

```http
POST /rest/v1/connections
{ "requester_id": "<soi>", "addressee_id": "<victime>", "status": "accepted" }
```

`allow_connections` vaut `true` par défaut sur les profils. La connexion est créée comme acceptée sans action de la victime.

**Impact :**  
- `can_view_profile()` accorde l'accès aux profils privés dès qu'une connexion `accepted` existe : nom complet, bio, ville, centres d'intérêt, etc.
- Combiné au constat 2.3, permet de lire l'adresse email de la victime.
- Ouvre la possibilité de demander le numéro de téléphone, d'engager une conversation privée et de spammer la victime.
- Contournement complet du consentement prévu par les règles de confidentialité.

**Remédiation :**

```sql
drop policy if exists connections_insert_self on public.connections;
create policy connections_insert_self on public.connections
  for insert to authenticated
  with check (
    requester_id = auth.uid()
    and requester_id <> addressee_id
    and status = 'pending'
    and responded_at is null
    and not public.is_blocked_between(requester_id, addressee_id)
    and private.profile_accepts_connections(addressee_id)
  );
```

Ajouter également un trigger `BEFORE INSERT` refusant tout statut autre que `pending` pour un appel authentifié, afin de ne pas dépendre uniquement du `GRANT`.

---

### 2.3 — Moyenne — Adresses email des profils exposées

**Fichiers :**
- `supabase/migrations/20261014000001_private_profile_contacts.sql` (lignes 32-38)
- `supabase/migrations/20260921000020_rls_profiles.sql` (lignes 54-57)

**Description :**  
Le téléphone a bien été déplacé vers `profile_contacts`, mais l'email reste dans `profiles` et est explicitement accordé en lecture :

```sql
grant select (
  id, username, display_name, full_name, email, avatar_url, bio, city, country, ...
) on public.profiles to authenticated;
```

La politique `profiles_select` autorise la lecture des profils `visibility = 'public' AND allow_search = true`, ainsi que des profils liés par une connexion acceptée.

**Scénario d'exploitation :**  
Un compte authentifié quelconque interroge l'API :

```http
GET /rest/v1/profiles?select=id,display_name,email&visibility=eq.public&allow_search=eq.true
```

Il obtient un annuaire d'emails, exploitable pour du phishing ou du spam. Le constat 2.2 permet même d'accéder aux emails de profils non publics.

**Impact :**  
Atteinte à la vie privée, risque RGPD, phishing ciblé, corrélation d'identités.

**Remédiation :**  
Retirer `email` du `GRANT SELECT` sur `profiles`, puis exposer l'email uniquement via une fonction `SECURITY DEFINER` contrôlée :

```sql
revoke select (email) on public.profiles from authenticated;
```

Créer par exemple `public.get_profile_email(target uuid)` qui vérifie `auth.uid() = target` ou `public.is_admin()` / `public.can_manage_org(...)`, et l'utiliser dans les pages admin et les actions d'équipe. À défaut, basculer ces lectures côté serveur avec le client `service_role` après contrôle d'autorisation explicite.

---

### 2.4 — Moyenne — Messagerie privée sans consentement

**Fichier :** `supabase/migrations/20260921000030_rls_messaging.sql` (lignes 15-47)

**Description :**  
N'importe quel utilisateur peut créer une conversation (`created_by = auth.uid()`), puis ajouter n'importe quel autre utilisateur comme participant :

```sql
create policy conversation_participants_insert on public.conversation_participants
  for insert to authenticated
  with check (
    user_id = auth.uid()
    or public.is_conversation_member(conversation_id)
  );
```

Aucun lien de connexion acceptée, aucun billet commun, aucun consentement n'est requis.

**Impact :**  
Envoi de messages privés non sollicités à n'importe quel utilisateur, spam, harcèlement, tentative de phishing. La victime voit la conversation apparaître dans sa messagerie.

**Remédiation :**  
Contraindre la création/participation à une relation légitime au niveau base :
- soit exiger une connexion `accepted` entre les participants ;
- soit exiger un billet commun / une appartenance commune à un salon ;
- et limiter l'ajout de participants au créateur de la conversation.

Ajouter également un quota anti-spam (nombre de conversations créées par heure).

---

### 2.5 — Moyenne — Rate limiting local et contournable

**Fichier :** `src/lib/rate-limit.ts` (lignes 1-46)

**Description :**  
Le compteur vit dans une `Map` en mémoire du processus. En production sur Cloudflare Workers/OpenNext, chaque isolate possède son propre état : les quotas sont multipliés par le nombre d'instances et remis à zéro à chaque redéploiement/cold start. L'en-tête `x-forwarded-for` est aussi fourni par le client si le proxy ne le réécrit pas.

**Impact :**  
Les protections ajoutées sur la recherche, la simulation de paiement et la création de commande sont affaiblies ; un attaquant peut contourner les limites en parallélisant les requêtes.

**Remédiation :**  
Brancher un stockage partagé derrière `checkRateLimit` : Upstash Redis, Cloudflare Rate Limiting binding, ou Durable Object. Utiliser l'IP fournie par l'infrastructure (`cf-connecting-ip` sur Cloudflare) plutôt que `x-forwarded-for` brut. Ajouter des quotas par utilisateur authentifié, pas seulement par IP.

---

### 2.6 — Moyenne — CSP permissive

**Fichier :** `next.config.ts` (lignes 10-25)

**Description :**  
La CSP est présente, mais :

```txt
script-src 'self' 'unsafe-inline'
connect-src 'self' https: wss:
img-src 'self' data: blob: https:
```

`'unsafe-inline'` affaiblit fortement la protection contre les XSS. `connect-src https:` autorise l'exfiltration vers n'importe quel domaine HTTPS en cas d'injection, et `img-src https:` permet des balises image vers des tiers.

**Impact :**  
Défense en profondeur réduite. En cas de faille XSS résiduelle, l'attaquant peut exfiltrer des données de session vers son propre serveur.

**Remédiation :**  
- Générer un nonce par requête dans `src/proxy.ts` et utiliser `script-src 'self' 'nonce-…' 'strict-dynamic'`.
- Restreindre `connect-src` à `'self'`, l'URL Supabase, et les domaines des prestataires de paiement réellement utilisés.
- Restreindre `img-src` aux domaines de stockage nécessaires.
- Ajouter `report-uri`/`report-to` pour détecter les violations.

---

### 2.7 — Moyenne — Migration `push_subscriptions` invalide

**Fichier :** `supabase/migrations/20261024000001_push_subscriptions.sql` (lignes 26-34)

**Description :**  
La politique admin référence `public.profiles.role`, colonne qui n'existe pas : les rôles sont stockés dans `public.user_roles`. La création de la politique échoue, ce qui peut bloquer l'application de la migration et empêcher le bon fonctionnement des notifications push.

**Remédiation :**

```sql
drop policy if exists "Admins can view all push subscriptions" on public.push_subscriptions;
create policy "Admins can view all push subscriptions"
on public.push_subscriptions
for select
using (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  )
);
```

---

### 2.8 — Faible — Un auteur peut épingler son post et le passer en « annonce »

**Fichier :** `supabase/migrations/20260921000026_rls_posts.sql` (lignes 27-37)

**Description :**  
La politique d'update autorise l'auteur à modifier sa ligne tant que `author_id = auth.uid()` et `is_hidden = false`, sans figer les colonnes réservées à la modération (`kind`, `is_pinned`, `reaction_count`, `comment_count`, `mentions`).

**Impact :**  
Un membre peut s'auto-attribuer une « annonce officielle », épingler son post en tête du salon, ou manipuler les compteurs affichés. Usurpation visuelle et pollution du fil.

**Remédiation :**  
Ajouter un trigger `BEFORE UPDATE` qui refuse ces colonnes pour un non-modérateur, ou scinder les droits par colonne (`GRANT UPDATE (content, media)` seulement pour l'auteur). Le `WITH CHECK` de la politique auteur devrait aussi imposer `kind = 'post'`.

---

### 2.9 — Faible — `ensure_event_salon()` sans contrôle d'autorisation

**Fichier :** `supabase/migrations/20260921000017_functions_event.sql` (lignes 44-108)

**Description :**  
Fonction `SECURITY DEFINER` exécutable par défaut par `PUBLIC` (aucun `REVOKE`). Elle crée un salon pour n'importe quel `target_event_id` sans vérifier que l'appelant gère l'événement.

**Impact :**  
Un utilisateur authentifié connaissant un UUID d'événement peut déclencher la création du salon, y inscrire l'équipe organisatrice, et perturber le cycle de vie d'un brouillon. Pas de fuite de données directe, mais atteinte à l'intégrité.

**Remédiation :**  
Ajouter au début de la fonction :

```sql
if auth.uid() is not null and not public.can_manage_event(target_event_id) then
  raise exception 'Événement non autorisé.' using errcode = '42501';
end if;
```

et révoquer l'exécution pour `anon`, en laissant `authenticated` (les appels serveur `service_role` ont `auth.uid()` nul).

---

### 2.10 — Faible — `log_audit()` injectable

**Fichier :** `supabase/migrations/20260921000018_functions_tickets.sql` (lignes 129-151)

**Description :**  
Fonction `SECURITY DEFINER` exécutable par `PUBLIC` : tout appelant peut insérer une entrée arbitraire dans `audit_logs` avec `actor_id = auth.uid()` (ou `NULL` en anonyme), un `action`, un `entity_type` et des payloads libres.

**Impact :**  
Pollution du journal d'audit, faux événements, difficulté d'investigation. Un utilisateur ne peut pas usurper l'identité d'un autre, mais peut fabriquer des traces crédibles.

**Remédiation :**  
Révoquer `EXECUTE` pour `anon`/`authenticated`, ou ajouter un contrôle `public.is_admin()` et une liste blanche d'`action`/`entity_type`. Les actions admin pourront continuer à l'appeler via la session authentifiée contrôlée.

---

### 2.11 — Faible — Fuite des emails d'invitation d'organisation

**Fichier :** `supabase/migrations/20260921000021_rls_organizations.sql` (lignes 52-59)

**Description :**

```sql
create policy organization_members_select on public.organization_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.can_manage_org(organization_id)
    or invited_email is not null
  );
```

La dernière condition rend lisibles **toutes** les lignes contenant un email d'invitation, pour n'importe quel utilisateur authentifié.

**Impact :**  
Fuite d'adresses email d'invités et d'informations sur les organisations (rôle, statut, date).

**Remédiation :**  
Remplacer `invited_email is not null` par une correspondance avec l'email de l'appelant :

```sql
or invited_email = (select auth.jwt() ->> 'email')::citext
```

---

### 2.12 — Faible — Réutilisation de la clé `service_role` comme secret HMAC

**Fichiers :**
- `src/lib/social/badge-url.ts` (lignes 30-50)
- `src/app/mon-badge/page.tsx` (ligne 34)
- `src/app/profil/[id]/page.tsx` (lignes 33-34)

**Description :**  
La signature des badges utilise `env.supabase.serviceRoleKey` comme clé HMAC. La signature elle-même ne révèle pas la clé, mais réutiliser un secret aussi critique pour un usage applicatif est une mauvaise pratique : rotation impossible indépendamment, et toute fuite de la clé compromet à la fois l'administration Supabase et les badges.

**Remédiation :**  
Introduire une variable dédiée `BADGE_SIGNING_SECRET` (32+ octets aléatoires), distincte de `SUPABASE_SERVICE_ROLE_KEY`, avec rotation prévue. Faire échouer le rendu du badge si elle est absente, plutôt que de retomber sur la clé admin.

---

### 2.13 — Faible — GET avec effet de bord sur le retour de paiement

**Fichier :** `src/app/commandes/[orderId]/retour/page.tsx` (lignes 60-74)

**Description :**  
Le simple chargement de la page appelle `verifyAndConfirm()` (vérification auprès du prestataire, voire confirmation de commande). L'accès est correctement restreint au propriétaire de la commande, mais l'effet de bord via `GET` permet des appels répétés (rechargement, prefetch, bot) et des requêtes sortantes coûteuses.

**Impact :**  
Faible : consommation de quotas prestataire, bruit, pas de modification non autorisée. Risque de CSRF limité car l'utilisateur doit être connecté et posséder la commande.

**Remédiation :**  
Déplacer la réconciliation vers un `POST`/server action déclenché explicitement, ou vers un job de fond idempotent. Ajouter une limitation par commande (par exemple une vérification toutes les 30 secondes).

---

### 2.14 — Faible — Scripts de test et artefacts de debug versionnés

**Fichiers :** `test_admin.js`, `test_db.js`, `test_insert.js`, `test_policies.js`, `test_rpc.js`

**Description :**  
Ces scripts lisent `.env.local` et instancient un client avec `SUPABASE_SERVICE_ROLE_KEY`. Ils ne contiennent pas de secret en dur, mais leur présence dans le dépôt facilite une exécution accidentelle avec des privilèges maximaux et élargit la surface d'attaque.

`debug-env.ts` et `src/app/api/debug/route.ts` sont déjà supprimés dans le répertoire de travail — bien.

**Remédiation :**  
Supprimer ces scripts du dépôt, ou les déplacer dans un dossier de scripts de développement explicitement ignoré et documenté. Ajouter une règle de revue pour empêcher tout fichier de debug d'atteindre la production.

---

## 3. Points vérifiés et conformes

- **Secrets :** `.env` et `.env.local` sont ignorés et absents de l'historique Git ; `.env.example` ne contient pas de valeur sensible.
- **Dépendances :** `npm audit --omit=dev` ne remonte aucune vulnérabilité connue (86 dépendances de production).
- **XSS :** aucun `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` ou `child_process` détecté ; React échappe le contenu.
- **Paiements :** signatures HMAC CinetPay et GeniusPay vérifiées, contrôle de fraîcheur, vérification serveur-à-serveur, contrôle du montant et de la devise, idempotence ; confirmation simulée désactivée en production et réservée au propriétaire de la commande.
- **Écritures sensibles :** commandes, lignes de commande, paiements et billets verrouillés côté serveur dans la migration de durcissement ; `generate_tickets_for_order` réservé à `service_role`.
- **Check-in :** `perform_check_in` vérifie que le scanner est bien l'utilisateur courant et dispose du rôle requis.
- **Connexions :** l'auto-acceptation par `UPDATE` est bloquée par `guard_connection_acceptance` ; le partage de téléphone est individuel et consenti.
- **Badge vérifié, rôles d'organisation et rôles de salon :** protégés en `UPDATE` par les triggers de durcissement (mais voir 2.1 pour l'`INSERT`).
- **Stockage :** buckets `avatars` et `event-covers` publics en lecture, écriture limitée au dossier de l'utilisateur ou aux gestionnaires ; `salon-photos` privé avec contrôle d'accès.
- **Redirections :** `safeRedirectPath()` bloque les URL absolues, protocole-relatives, antislashs et caractères de contrôle (correctif non commité).
- **En-têtes :** HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` présents.
- **RLS :** activée sur les tables sensibles ; les vues utilisent `security_invoker = true`.
- **Service role :** utilisé uniquement côté serveur, jamais exposé au client.

---

## 4. Plan d'action recommandé

### Immédiat — ✅ réalisé le 9 novembre 2026

1. ✅ `20261028000001_security_hardening.sql` appliquée.
2. ✅ Escalade `salon_members` corrigée (constat 2.1).
3. ✅ Connexion forcée `connections.status` corrigée (constat 2.2).
4. ✅ `email` retiré des privilèges de lecture/écriture de `profiles` (constat 2.3).
5. ✅ Correctifs applicatifs déployés (rate limit, redirections, webhooks, checkout).
6. ✅ Scripts `test_*.js` supprimés.
7. ✅ Migration `push_subscriptions`, `ensure_event_salon`, `log_audit`, policy `organization_members_select` et colonnes modifiables des posts corrigés.

### Court terme (dans les deux semaines)

8. Rate limiting partagé (Redis/Upstash) et clé dérivée de l'IP d'infrastructure.
9. CSP à nonce et listes blanches `connect-src`/`img-src`.
10. Consentement obligatoire pour la messagerie (policy déjà en place, à couvrir par des tests).

### Moyen terme

11. Secret HMAC dédié aux badges et procédure de rotation.
12. Vérification asynchrone/idempotente des retours de paiement.
13. Journalisation et alerting sur les tentatives d'escalade RLS (erreurs `42501`), les créations de connexions acceptées sans `UPDATE`, et les insertions de rôles de salon.
14. Revoir l'ensemble des politiques `FOR INSERT` avec la même grille : « quelles colonnes privilégiées le client peut-il fournir ? ».

---

## 5. Conclusion

Les fondations sont solides : séparation client/serveur, RLS systématique, paiements vérifiés, pas de secret versionné. Les deux failles d'élévation de privilèges identifiées ont été corrigées par la migration `20261109000001_security_audit_fixes.sql`, appliquée sur le projet Supabase distant, et l'email des profils n'est plus accessible aux clients.

Les priorités restantes sont le rate limiting partagé, une CSP plus stricte et un secret HMAC dédié aux badges.
