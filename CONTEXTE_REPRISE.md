# Contexte de reprise pour l’application Event

Cette note sert à reprendre le travail dans une nouvelle session sans devoir reconstruire tout l’historique. Elle décrit l’état au 27 septembre 2026.

## Préférences importantes de la personne

- L’application s’appelle **Event**.
- Direction visuelle : réseau social événementiel distinctif, urbaine et contemporaine, contrastes maîtrisés et couleurs atténuées pour éviter une interface trop claire ou fatigante.
- Éviter les codes « vibe coding » : pas de dégradé violet, boutons en pilule, avis ou métriques fictifs, faux compteurs de clients, texte de hero vague, emojis à la place d’icônes, images générées par IA, textes générés par IA ni em dash.
- L’application doit rester responsive, particulièrement sur mobile, et donner un indicateur de chargement lors des actions.
- **Processus de publication actuel :** d’abord corriger et vérifier en local. Ne pas pousser automatiquement à la fin de chaque tâche. Pousser sur GitHub/Railway uniquement après autorisation explicite de la personne.
- Les commandes dans ce dépôt doivent être lancées via `rtk proxy` conformément aux instructions locales `C:\Users\Lemic\.codex\RTK.md`.

## Dépôt et production

- Dossier : `C:\Projets_informatiques\projet_evennement`
- Branche : `main`
- Remote `origin` : `https://github.com/MarreeNoire/projet_evennement.git`
- Projet Railway : `profound-energy`, service `projet_evennement`, environnement `production`.
- Domaine public : `https://projetevennement-production.up.railway.app`
- Dernier commit poussé et déployé vérifié : `43d09a8` (`Use public request origin for badge QR`). Railway l’a indiqué **ACTIVE / Deployment successful**.
- La version production `43d09a8` fixe le domaine `localhost` du QR, mais **ne contient pas encore le correctif du 404 décrit ci-dessous**.

## Changements déjà livrés récemment

- `a39bad0` : indicateurs de chargement des actions.
- `0a8b584` : filtres de découverte par date, vrais tris par date/prix, organisation des salons avant/pendant/après événement. Tests locaux de cette livraison : 51 tests, TypeScript et build passés.
- `10380ec` : premier correctif du badge, remplacement du domaine historique `rassemble.ci` par l’origine configurée. Tests : 53 passés. La livraison a été publiée.
- `43d09a8` : construction du domaine du badge à partir de `x-forwarded-host` et `x-forwarded-proto` pour éviter `localhost` sur Railway. Tests : 55 passés, TypeScript et build passés. Push et déploiement actifs confirmés dans Railway.

## Problème actuel et état exact du travail

La personne a signalé que le QR du badge ouvre bien le site, mais la fiche retourne une erreur 404.

Cause identifiée dans le dépôt :

- `src/app/profil/[id]/page.tsx` lit la table `profiles` avec le client Supabase utilisateur.
- La migration `supabase/migrations/20260921000020_rls_profiles.sql` définit `profiles_select` **uniquement pour le rôle `authenticated`** et applique `can_view_profile(id)`.
- Un scan sans session ou par un compte sans événement commun ne peut donc pas lire le profil ; la page reçoit `null` et appelle `notFound()`.
- Le QR actuel pointe à `/profil/{id}`. Le changement de domaine précédent a corrigé `localhost`, mais pas cette politique d’accès.

### Correctif local non publié

Le travail local en cours remplace le lien QR par un lien de badge signé :

- `src/lib/social/badge-url.ts` : signature HMAC SHA-256, validation avec comparaison en temps constant, résolution de l’origine à partir des en-têtes proxy Railway.
- `src/app/mon-badge/page.tsx` : encode le lien de profil avec signature fondée sur `SUPABASE_SERVICE_ROLE_KEY`.
- `src/app/profil/[id]/page.tsx` : accepte le paramètre signé `badge`, ne le traite que si sa signature est valide, puis charge côté serveur uniquement les champs nécessaires à la fiche (`id`, nom, avatar, ville, bio, vérification, intérêts et autorisation de connexion) avec le client admin. Les visites ordinaires restent soumises aux règles RLS.
- La fiche badge peut être affichée sans session ; si les connexions sont autorisées, un visiteur non connecté voit un bouton qui l’envoie vers la connexion, puis revient à cette fiche.
- `tests/badge-url.test.ts` teste l’origine publique Railway, l’origine localhost en développement, l’encodage des ID et le rejet d’une signature altérée.

### Dernières vérifications locales

- Tests : **56 passés**.
- `npm run typecheck` : réussi.
- `npm run build` : réussi. Next.js affiche des messages `Dynamic server usage: ... cookies` pendant le pré-rendu de routes dynamiques, puis termine avec code 0 et génère les 46 pages. Ces messages étaient déjà présents auparavant.
- Prettier a été appliqué aux fichiers modifiés.

### Git au moment de la rédaction

HEAD reste `43d09a8`. Changements non commités à reprendre :

- `src/app/mon-badge/page.tsx`
- `src/app/profil/[id]/page.tsx`
- `src/lib/social/badge-url.ts`
- `tests/badge-url.test.ts`

Rien n’a été poussé après `43d09a8`. Le dernier contrôle avant la rédaction indiquait `main...origin/main` avec ces quatre fichiers modifiés.

## Prochaines étapes recommandées

1. Relire le diff local de ces quatre fichiers et confirmer qu’aucune donnée sensible n’est renvoyée par la fiche signée. La sélection admin côté serveur est limitée aux champs explicitement affichés.
2. Si possible, lancer l’application localement et vérifier le parcours complet avec une session de test : ouvrir « Mon badge », vérifier que le QR encode `/profil/{id}?badge=...`, ouvrir cette URL en navigation privée, vérifier que la fiche s’affiche, puis vérifier que le bouton de connexion conserve le chemin de retour.
3. Demander l’autorisation de publication si elle n’est pas déjà donnée dans le tour courant. La préférence permanente de la personne est maintenant de tester en local d’abord et d’autoriser explicitement les pushes.
4. Après autorisation, commit/push `main`, puis vérifier le déploiement Railway. Pour vérifier en production, utiliser un véritable lien signé du badge, car l’ouverture sans signature doit rester refusée par RLS.

Ne jamais publier le contenu de `.env.local`, `SUPABASE_SERVICE_ROLE_KEY` ou une signature QR dans un journal ou un message.

