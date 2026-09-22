# Rassemble

Plateforme événementielle et communautaire : découvrir un événement, réserver sa
place, entrer dans son **salon communautaire**, échanger avant / pendant / après,
et conserver la communauté et les souvenirs.

> **Chaque événement devient une communauté.** La billetterie n'est que le point
> d'entrée ; la valeur se crée dans le salon.

---

## Sommaire

1. [Périmètre fonctionnel](#périmètre-fonctionnel)
2. [Stack technique](#stack-technique)
3. [Prérequis](#prérequis)
4. [Installation](#installation)
5. [Variables d'environnement](#variables-denvironnement)
6. [Base de données](#base-de-données)
7. [Scripts disponibles](#scripts-disponibles)
8. [Architecture du dépôt](#architecture-du-dépôt)
9. [Modes dégradés](#modes-dégradés)
10. [Ce que tu dois fournir](#ce-que-tu-dois-fournir)
11. [Sécurité](#sécurité)
12. [Déploiement](#déploiement)

---

## Périmètre fonctionnel

| Domaine | Contenu |
|---|---|
| **Découverte** | Accueil personnalisé, explorer, recherche et filtres (date, catégorie, prix, lieu), page événement complète |
| **Billetterie** | Types de billets (prix, quotas, fenêtre de vente, limite par acheteur, niveau d'accès), codes promo, commandes, paiement FCFA, billets numériques et QR |
| **Paiement** | CinetPay : Wave, Orange Money CI, MTN MoMo, Moov et cartes. Webhook signé + vérification serveur-à-serveur |
| **Salon communautaire** | Créé et rejoint automatiquement à l'achat. Fil de discussion, annonces, photos et albums, participants, programme, infos |
| **Networking** | Recherche de participants avec contrôle de visibilité, suggestions par intérêts et événements communs, connexions, « Mon badge » QR, messagerie privée, blocage |
| **Check-in** | Scan QR (caméra) + recherche manuelle, validation serveur, résistant aux scans concurrents, historique complet |
| **Organisateur** | Tableau de bord, analytics, événements, billetterie, participants, check-in, marketing, équipe et permissions, paiements |
| **Administration** | Utilisateurs, événements, paiements et commissions, modération des signalements, paramètres plateforme |
| **Temps réel** | Discussion, réactions, notifications, compteurs et présence en direct (WebSocket) |
| **Emails** | Bienvenue, confirmation d'achat avec QR, rappel, annonce organisateur, annulation et remboursement |

Hors périmètre V1 (prévu en V2/V3) : covoiturage, objets trouvés, marketplace,
sondages avancés, parrainage, badges, IA, application mobile native, API publique.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend + serveur | **Next.js 16** (App Router) · React 19 · TypeScript 5.9 |
| Style | **Tailwind CSS 4** et design system « Kora » (`src/app/globals.css`) |
| Base de données | **PostgreSQL** via **Supabase** (SQL, RLS, triggers, vues) |
| Authentification | Supabase Auth (email et mot de passe, Google OAuth optionnel) |
| Fichiers | Supabase Storage (avatars, couvertures, photos de salon) |
| Temps réel | Supabase Realtime (WebSocket) |
| Paiement | **CinetPay** (mobile money CI et cartes), abstraction interchangeable |
| Emails | **Resend** et modèles HTML maison |
| Validation | **Zod 4** |
| Graphiques | Recharts |
| Tests | Vitest (unitaire) · Playwright (bout en bout) |
| Hébergement | Vercel |

**Pourquoi pas un backend Node/Express séparé ?** Un seul déploiement à
exploiter, la sécurité au niveau ligne (RLS) garantit qu'un participant ne lit
que ce qu'il a le droit de lire, et Supabase Realtime couvre déjà le WebSocket.
Le code métier reste isolé dans `src/server` : brancher un backend dédié plus
tard n'impose aucune réécriture.

---

## Prérequis

| Outil | Version | Remarque |
|---|---|---|
| **Node.js** | **22 LTS ou 24 LTS** | ⚠️ Node 25 (version *impaire*, non-LTS) n'est pas supporté par `jsdom`, utilisé par les tests. L'application fonctionne, mais `npm run test` peut échouer. `nvm use 24` est recommandé. |
| npm | ≥ 10 | ou pnpm |
| Git | ≥ 2.40 | |
| CLI Supabase | dernière | `npm i -g supabase` — nécessaire pour appliquer les migrations |
| Docker | dernière | uniquement pour faire tourner Supabase en local |

---

## Installation

```bash
# 1. Dépendances
npm install

# 2. Configuration
cp .env.example .env.local
#    puis renseigne les variables (voir ci-dessous)

# 3. Démarrage
npm run dev
```

L'application démarre **sans aucune clé** : voir [Modes dégradés](#modes-dégradés).

---

## Variables d'environnement

Le modèle complet est dans `.env.example`, à copier en `.env.local`.

| Variable | Obligatoire | Rôle |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | production | URL publique, **en `https://`** |
| `NEXT_PUBLIC_APP_NAME` | non | Nom affiché (défaut : `Rassemble`) |
| `PLATFORM_COMMISSION_RATE` | non | Commission plateforme (`0.05` = 5 %) |
| `PAYMENT_PROVIDER` | non | `mock` (défaut) ou `cinetpay` |
| `EMAIL_PROVIDER` | non | `console` (défaut) ou `resend` |
| `NEXT_PUBLIC_SUPABASE_URL` | production | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | production | Clé publique (navigateur) |
| `SUPABASE_SERVICE_ROLE_KEY` | production | ⚠️ **Serveur uniquement** |
| `RESEND_API_KEY` | si emails réels | Clé API Resend |
| `EMAIL_FROM` | si emails réels | Adresse d'un domaine vérifié |
| `EMAIL_REPLY_TO` | non | Adresse de réponse |
| `CINETPAY_API_KEY` | si paiement réel | Clé API CinetPay |
| `CINETPAY_SITE_ID` | si paiement réel | Identifiant de site |
| `CINETPAY_SECRET_KEY` | si paiement réel | Clé de signature HMAC |
| `CINETPAY_BASE_URL` | non | `https://api-checkout.cinetpay.com` |
| `CINETPAY_CHANNELS` | non | `ALL` par défaut |
| `CRON_SECRET` | production | Protège les routes `/api/cron/*` |

`src/lib/env.ts` valide le tout au démarrage. `assertProductionEnv()` refuse la
production si une dépendance indispensable manque, en listant précisément les
variables absentes.

---

## Base de données

Les migrations sont versionnées dans `supabase/migrations` et s'appliquent dans
l'ordre alphabétique :

| Fichiers | Contenu |
|---|---|
| `0001` | Extensions (`pg_trgm`, `unaccent`, `citext`), types énumérés, fonctions utilitaires |
| `0002` | Profils, rôles, organisations, équipes |
| `0003` – `0004` | Événements, programme, intervenants |
| `0005` – `0006` | Types de billets, codes promo, commandes, paiements |
| `0007` | Billets et contrôle d'accès |
| `0008` – `0009` | Salons, publications, commentaires, réactions |
| `0010` | Albums, médias et signalements |
| `0011` – `0012` | Connexions, blocages, messagerie privée |
| `0013` – `0014` | Notifications, audit, paramètres, versements |
| `0015` – `0019` | Amorce utilisateur, compteurs, accès salon, billets, **check-in** |
| `0020` – `0031` | **Politiques RLS** (sécurité) et vues métier |
| `0032` | Buckets et politiques de stockage |
| `0033` | Publication temps réel |

Application :

```bash
# Liaison au projet distant (une seule fois)
supabase link --project-ref <reference-du-projet>

# Envoi des migrations
npm run db:push

# Régénérer les types TypeScript depuis la base réelle
npm run db:types
```

> Les types de `src/types/database.ts` ont été écrits à la main pour refléter
> exactement les migrations. `npm run db:types` les remplacera par la version
> générée, toujours plus fidèle.

### Points d'attention techniques

- Les colonnes `Row` sont déclarées en **alias de type** (`type X = { … }`) et
  non en `interface`. En TypeScript, une `interface` n'est pas assignable à
  `Record<string, unknown>` (absence d'index signature implicite) : le schéma ne
  satisferait pas le contrat `GenericSchema` de `supabase-js`, qui retomberait
  alors sur `any` et ferait perdre tout le typage des requêtes.
- Les prix sont des **entiers de francs CFA** (`integer`), la devise n'ayant pas
  de décimales. La fonction `round_fcfa()` le garantit.
- `orders.total` est contraint par la base : `total = subtotal - discount + fees`.
  Une incohérence arithmétique est rejetée au niveau SQL.

---

## Scripts disponibles

| Script | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm start` | Démarre le build de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification TypeScript (`tsc --noEmit`) |
| `npm run format` | Formatage Prettier |
| `npm run test` | Tests unitaires (Vitest) |
| `npm run test:e2e` | Tests de bout en bout (Playwright) |
| `npm run db:push` | Applique les migrations |
| `npm run db:reset` | Réinitialise la base locale |
| `npm run db:types` | Régénère `src/types/database.ts` |

---

## Architecture du dépôt

```text
src/
├─ app/                 Routes App Router (pages, layouts, route handlers)
│  └─ globals.css       Design system « Kora » : tokens, base, utilitaires
├─ components/          UI, événements, salon, billets, graphiques
├─ lib/
│  ├─ supabase/         Clients navigateur / serveur / administrateur
│  ├─ payments/         Abstraction paiement
│  │  ├─ types.ts               Contrat commun à tous les prestataires
│  │  ├─ mock.ts                Prestataire de développement
│  │  ├─ cinetpay.ts            Prestataire de production
│  │  ├─ cinetpay-payload.ts    Mise en forme et normalisation des échanges
│  │  ├─ cinetpay-signature.ts  Vérification HMAC (module isolé, testable)
│  │  └─ index.ts               Fabrique : choisit le prestataire actif
│  ├─ email/            Abstraction email
│  │  ├─ console.ts             Affichage en console (développement)
│  │  ├─ resend.ts              Envoi réel (production)
│  │  ├─ templates-layout.ts    Gabarit HTML commun
│  │  ├─ templates.ts           Bienvenue, confirmation d'achat
│  │  └─ templates-events.ts    Rappel, annonce, annulation
│  ├─ constants.ts      Constantes métier (catégories, statuts, limites)
│  ├─ env.ts            Validation de l'environnement
│  └─ utils.ts          Formatage FCFA, dates en français, helpers
├─ server/              Actions serveur, services métier, requêtes
└─ types/database.ts    Types du schéma PostgreSQL

supabase/migrations/    33 fichiers : schéma, RLS, fonctions, stockage, temps réel
docs/DEPLOIEMENT.md     Procédure de mise en production
```

### Choix de conception structurants

| Choix | Raison |
|---|---|
| **Abstraction paiement** (`PaymentProvider`) | Changer d'agrégateur (PayDunya, Hub2, Flutterwave) revient à ajouter une classe. Aucun autre fichier à toucher. |
| **Abstraction email** (`EmailProvider`) | Le parcours métier ne dépend jamais du prestataire, et un échec d'email ne casse jamais un achat. |
| **Décision financière serveur-à-serveur** | La notification HTTP est un simple déclencheur. Un webhook forgé ou rejoué ne délivre pas de billet. |
| **Génération des billets en SQL idempotent** | Un webhook reçu deux fois ne crée pas de doublons. |
| **Check-in avec verrou de ligne** | Deux agents ne peuvent pas valider le même billet simultanément. |
| **Compteurs dénormalisés** (`member_count`, `post_count`, `sold_count`) | Évite des `COUNT(*)` coûteux sur les écrans de salon ; maintenus par triggers. |
| **Vues `SECURITY INVOKER`** | Les vues respectent les politiques RLS de l'appelant, jamais celles du créateur. |

---

## Modes dégradés

L'application est conçue pour tourner **sans aucun compte externe** :

| Mode | Comportement |
|---|---|
| `PAYMENT_PROVIDER=mock` | Parcours d'achat complet, page de simulation, génération réelle des billets et des QR codes. **Refuse de démarrer en production.** |
| `EMAIL_PROVIDER=console` | Les emails sont affichés dans la console du serveur au lieu d'être envoyés. |

Passer en réel consiste uniquement à renseigner les clés et à basculer ces deux
variables. **Aucun code à modifier.**

---

## Ce que tu dois fournir

Le détail pas à pas, avec les écrans et les champs à copier, est dans
**[`docs/DEPLOIEMENT.md`](docs/DEPLOIEMENT.md)**. En résumé :

| Service | Indispensable | Ce qu'il faut récupérer |
|---|---|---|
| **Supabase** | oui | Project URL, clé `anon`, clé `service_role`, mot de passe base |
| **Domaine + DNS** | oui | Nom de domaine et accès à la zone DNS (SPF/DKIM/DMARC) |
| **Resend** | oui | Clé API, domaine vérifié, *Production Approval* |
| **CinetPay** | oui | `apikey`, `site_id`, `secret key` (compte marchand validé) |
| **GitHub** | oui | Dépôt privé |
| **Vercel** | oui | Projet lié au dépôt + variables d'environnement |
| Google OAuth | non | `Client ID` / `Client Secret` |
| Cartes (Maps) | non | Clé API |
| Upstash Redis | non | `REST URL` / `TOKEN` (limitation de débit) |
| Sentry | non | `DSN` |

⚠️ **À ne jamais transmettre** : les mots de passe de tes comptes. Les clés se
placent dans `.env.local` (ignoré par Git) ou dans les variables d'environnement
Vercel.

---

## Sécurité

- **RLS activée sur toutes les tables.** Un participant ne peut pas lire un
  événement en brouillon, un billet qui n'est pas le sien, ni un profil dont la
  visibilité l'exclut.
- **Le client `service_role` est réservé au serveur** et n'apparaît dans aucun
  composant client.
- **Le paiement n'est jamais validé par la notification HTTP seule** : la
  décision vient d'un appel serveur-à-serveur, puis d'une confirmation
  idempotente en base.
- **Le check-in est sérialisé en base** (`SELECT … FOR UPDATE`).
- **Journal d'audit** sur les opérations financières, la modération et les
  actions d'administration.
- **En-têtes de sécurité** (HSTS, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`) appliqués à toutes les réponses — voir `next.config.ts`.
- **Accessibilité WCAG 2.2 AA** : contrastes vérifiés et documentés dans
  `globals.css`, focus visible partout, `prefers-reduced-motion`,
  `forced-colors`, navigation clavier complète.

---

## Déploiement

Voir **[`docs/DEPLOIEMENT.md`](docs/DEPLOIEMENT.md)** pour la procédure complète :
Supabase, domaine, Resend, CinetPay, Vercel, premier administrateur, tâches
planifiées, sauvegardes et liste de contrôle finale.

---

## Contexte

Projet conçu pour le marché ivoirien et l'Afrique francophone : devise **FCFA**,
formats de date en français, montants sans décimales, et **mobile money** (Wave,
Orange Money, MTN MoMo, Moov) comme moyen de paiement principal.

Le lancement est prévu par étapes : Abidjan, puis Côte d'Ivoire, puis Afrique
francophone.