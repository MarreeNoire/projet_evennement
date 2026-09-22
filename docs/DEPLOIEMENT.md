# Guide de déploiement

Procédure complète, dans l'ordre, pour passer du dépôt à une application
réellement utilisable par des participants qui paient en FCFA.

> Temps estimé : **2 à 3 heures** pour les comptes, plus **24 à 72 h** d'attente
> pour la validation du compte marchand CinetPay.

---

## Sommaire

1. [Vue d'ensemble](#1-vue-densemble)
2. [Préparer le dépôt](#2-préparer-le-dépôt)
3. [Supabase](#3-supabase)
4. [Domaine et DNS](#4-domaine-et-dns)
5. [Resend (emails)](#5-resend-emails)
6. [CinetPay (paiements)](#6-cinetpay-paiements)
7. [Vercel (hébergement)](#7-vercel-hébergement)
8. [Premier administrateur](#8-premier-administrateur)
9. [Tests de bout en bout](#9-tests-de-bout-en-bout)
10. [Tâches planifiées](#10-tâches-planifiées)
11. [Sauvegardes et supervision](#11-sauvegardes-et-supervision)
12. [Liste de contrôle finale](#12-liste-de-contrôle-finale)

---

## 1. Vue d'ensemble

```text
Participant                        Plateforme (Vercel)              Prestataires
     │                                    │                             │
     │  achète un billet ────────────────▶│  Next.js (serveur)          │
     │                                    │──── crée la commande ──────▶│ Supabase (Postgres)
     │                                    │──── ouvre le paiement ─────▶│ CinetPay
     │◀── redirection vers CinetPay ──────│                             │
     │  paie (Wave / OM / MTN / Moov) ───▶│                             │
     │                                    │◀── webhook (déclencheur) ───│
     │                                    │──── vérification ──────────▶│
     │                                    │  génère les billets (SQL)   │
     │◀── email avec QR code ─────────────│──── envoi ─────────────────▶│ Resend
     │◀── accès au salon communautaire ───│                             │
```

Points clés de fiabilité :

- le **webhook ne valide jamais seul** un paiement : le serveur interroge
  CinetPay, puis confirme en base de façon **idempotente** ;
- la génération des billets vit dans une **fonction SQL rejouable**, donc un
  webhook reçu deux fois ne crée pas de doublons ;
- le **check-in** verrouille la ligne du billet : impossible de scanner deux fois
  le même billet, même avec plusieurs agents simultanés.

---

## 2. Préparer le dépôt

1. Crée un **dépôt GitHub privé** et pousse le code :

   ```bash
   git add .
   git commit -m "Socle de la plateforme événementielle"
   git branch -M main
   git remote add origin https://github.com/<ton-compte>/<ton-depot>.git
   git push -u origin main
   ```

2. Vérifie que `.env.local` **n'est pas** suivi par Git :

   ```bash
   git status --porcelain | grep -i env   # ne doit rien afficher d'utile
   ```

Le fichier `.gitignore` fourni exclut déjà `.env*` (sauf `.env.example`).

---

## 3. Supabase

### 3.1 Créer le projet

1. Va sur **https://supabase.com/dashboard** et crée un compte.
2. **New project**.
3. Renseigne :
   - **Name** : `rassemble-prod`
   - **Database Password** : génère un mot de passe fort et **conserve-le**
   - **Region** : **Paris (`eu-west-3`)** ou **Francfort (`eu-central-1`)** —
     les plus proches d'Abidjan (Supabase n'a pas encore de région africaine)
4. Attends environ 2 minutes que le projet soit provisionné.

> ⚠️ **Passe au plan Pro (environ 25 $/mois).**
> Sur le plan gratuit, Supabase **met le projet en pause après 7 jours de faible
> activité**, ce qui rend l'application indisponible pour tes utilisateurs. Un
> projet payant n'est jamais mis en pause automatiquement.
> *Billing → Upgrade to Pro.*

### 3.2 Récupérer les clés

**Project Settings → API** :

| Champ à copier | Variable à renseigner |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` **public** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` **secret** | `SUPABASE_SERVICE_ROLE_KEY` |

> La clé `service_role` contourne toutes les règles de sécurité. Elle ne doit
> servir **que côté serveur**. Ne la mets jamais dans une variable préfixée
> `NEXT_PUBLIC_`, et ne la partage jamais publiquement.
> Selon la version de ton tableau de bord, elle peut s'appeler `sb_secret_…`.

### 3.3 Appliquer le schéma

```bash
npm i -g supabase
supabase login
supabase link --project-ref <reference-du-projet>
npm run db:push
```

La référence du projet se trouve dans l'URL du tableau de bord :
`https://supabase.com/dashboard/project/<reference>`.

À la fin, **Database → Tables** doit afficher une trentaine de tables, et
**Authentication → Policies** doit lister les politiques RLS.

### 3.4 Configurer l'authentification

**Authentication → Sign In / Providers** :

- **Email** : activé.
- **Confirm email** : *activé* en production (l'utilisateur doit confirmer son
  adresse) — tu peux le désactiver le temps des tests.
- **Google** (optionnel) : renseigne `Client ID` et `Client Secret` obtenus sur
  Google Cloud Console, puis ajoute l'URL de redirection affichée par Supabase.

**Authentication → URL Configuration** :

| Champ | Valeur |
|---|---|
| Site URL | `https://ton-domaine.ci` |
| Redirect URLs | `https://ton-domaine.ci/**`<br>`http://localhost:3000/**` (développement) |

### 3.5 Vérifier le stockage

**Storage** doit contenir trois buckets créés par la migration `0032` :

| Bucket | Accès | Usage |
|---|---|---|
| `avatars` | public | Photos de profil |
| `event-covers` | public | Couvertures d'événements |
| `salon-photos` | **privé** | Photos et vidéos des salons (servies par URL signée) |

---

## 4. Domaine et DNS

1. Achète un domaine chez un registrar (Namecheap, OVH, Hostinger, Infomaniak…).
   Exemples : `rassemble.ci` (réservé aux entités ivoiriennes via NIC.CI) ou
   `rassemble.app`.
2. Garde l'accès à la **zone DNS** : les étapes 5 et 7 y ajoutent des
   enregistrements.
3. Une fois Resend et Vercel configurés, il y aura au total :

| Type | Nom | Valeur | Service |
|---|---|---|---|
| `A` | `@` | `76.76.21.21` | Vercel |
| `CNAME` | `www` | `cname.vercel-dns.com` | Vercel |
| `TXT` | `@` | `v=spf1 include:amazonses.com ~all` | Resend (SPF) |
| `TXT` | `resend._domainkey` | *(fourni par Resend)* | Resend (DKIM) |
| `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@ton-domaine.ci` | Resend (DMARC) |

> N'ajoute ces enregistrements qu'après avoir lu les deux sections suivantes :
> chaque service fournit les valeurs exactes à recopier.

---

## 5. Resend (emails)

Sans cette étape, aucun email ne part réellement (le mode `console` se contente
de les afficher dans les logs du serveur).

### 5.1 Créer le compte et le domaine

1. Crée un compte sur **https://resend.com**.
2. **Domains → Add Domain** : saisis `ton-domaine.ci`.
3. Resend affiche les enregistrements DNS à créer. Ajoute-les chez ton registrar :

   | Type | Nom | Valeur |
   |---|---|---|
   | `TXT` | `@` | `v=spf1 include:amazonses.com ~all` |
   | `TXT` | `resend._domainkey` | *(clé DKIM fournie)* |
   | `TXT` | `_dmarc` | `v=DMARC1; p=none;` |
   | `MX` | `send` | `feedback-smtp.eu-west-1.amazonses.com` (priorité 10) |

4. Attends la propagation DNS (de quelques minutes à quelques heures), puis
   clique sur **Verify DNS Records**. Le statut doit passer à **Verified**.

### 5.2 Obtenir la Production Approval

Par défaut, un compte Resend ne peut envoyer qu'à sa propre adresse. Pour écrire
à **n'importe quel destinataire** :

**Settings → Production Approval** (ou *Enable production access*), remplis le
formulaire décrivant ton usage. C'est une étape **indispensable** en production.

### 5.3 Récupérer la clé

**API Keys → Create API Key** :

- Permission : **Sending access**
- Domain : `ton-domaine.ci`

Copie la clé (`re_…`) dans `RESEND_API_KEY`, puis définis :

```bash
EMAIL_PROVIDER=resend
EMAIL_FROM="Rassemble <billets@ton-domaine.ci>"
EMAIL_REPLY_TO=support@ton-domaine.ci
```

### 5.4 Limites à connaître

| Plan | Quota | Débit | Domaines |
|---|---|---|---|
| **Free** | 100 emails/jour, 3 000/mois | 10 requêtes/s | 3 |
| **Pro** (environ 20 $/mois) | pas de quota journalier, 50 000/mois | idem | 10 |

Contraintes imposées par Resend, à surveiller dans **Metrics** :

- taux de rebond **< 4 %** ;
- taux de spam **< 0,08 %**.

Un dépassement entraîne une suspension temporaire de l'envoi. Ces deux limites
justifient de n'écrire qu'aux utilisateurs ayant consenti, et de **désactiver les
adresses invalides** plutôt que de réessayer.

---

## 6. CinetPay (paiements)

C'est l'étape la plus longue : elle dépend d'une **validation de compte marchand**
qui peut prendre de 24 h à quelques jours.

### 6.1 Pourquoi CinetPay

| Critère | CinetPay |
|---|---|
| Licence | Établissement de paiement autorisé par la **BCEAO** |
| Moyens couverts | **Wave CI, Orange Money CI, MTN MoMo, Moov Africa + Visa/Mastercard** |
| Devise | FCFA (XOF) natif, sans conversion |
| Commission | environ 1,5 % à 2 % par transaction |
| Intégration | API REST, webhooks, tableau de bord en français |

Un agrégateur unique évite d'intégrer quatre SDK mobile money séparés. À noter :
depuis le 30 juin 2026, les prestataires encaissant en FCFA doivent être reliés au
système d'instantané interopérable **PI-SPI** de la BCEAO — CinetPay est concerné
et à jour de cette obligation.

### 6.2 Ouvrir le compte marchand

1. Va sur **https://cinetpay.com** puis **Créer un compte** (ou
   `https://app.cinetpay.com` pour le tableau de bord).
2. Crée un **compte marchand** en précisant ton activité : *billetterie
   événementielle*.
3. Prépare les pièces justificatives :
   - pièce d'identité du représentant ;
   - justificatif d'entreprise (RCCM / DFE) **ou** compte personnel selon le
     type de compte choisi ;
   - coordonnées bancaires ou compte mobile money de réception ;
   - l'URL de ton site (celle de Vercel, étape 7, ou ton domaine final).
4. Renseigne l'URL de ton site : CinetPay la vérifie. Déploie donc Vercel
   (étape 7) **avant** de finaliser, ou saisis une URL temporaire que tu mettras à
   jour ensuite.

### 6.3 Récupérer les trois clés

Dans ton tableau de bord CinetPay : **Intégration → Clés d'API** (ou
*Paramètres → API*).

| Champ CinetPay | Variable à renseigner |
|---|---|
| `apikey` | `CINETPAY_API_KEY` |
| `site_id` | `CINETPAY_SITE_ID` |
| `secret_key` *(clé de signature)* | `CINETPAY_SECRET_KEY` |

Puis :

```bash
PAYMENT_PROVIDER=cinetpay
CINETPAY_BASE_URL=https://api-checkout.cinetpay.com
CINETPAY_CHANNELS=ALL
```

### 6.4 Déclarer l'URL de notification

Le webhook doit pointer vers ton domaine de production :

```text
https://ton-domaine.ci/api/webhooks/cinetpay
```

Cette URL est transmise automatiquement par l'application à chaque création de
paiement (paramètre `notify_url`). Tu peux aussi la déclarer côté CinetPay si son
interface le propose : les deux mécanismes coexistent sans conflit.

### 6.5 Activer les moyens de paiement

Toujours dans le tableau de bord, vérifie que les canaux souhaités sont
**activés** pour ton site :

- Wave Côte d'Ivoire
- Orange Money Côte d'Ivoire
- MTN Mobile Money
- Moov Africa
- Cartes Visa / Mastercard

`CINETPAY_CHANNELS=ALL` laisse CinetPay présenter tous les canaux activés au
client. Tu peux restreindre avec `MOBILE_MONEY` ou `CREDIT_CARD` si besoin.

### 6.6 Tester avant d'encaisser réellement

1. Garde d'abord `PAYMENT_PROVIDER=mock` et déroule le parcours complet pour
   valider commandes, billets et QR codes.
2. Passe ensuite à `PAYMENT_PROVIDER=cinetpay` avec les clés de **test**
   (sandbox) si ton compte en fournit, et effectue un achat de faible montant.
3. Vérifie dans CinetPay que la transaction apparaît **ACCEPTED**, et dans
   `Database → payments` qu'une ligne est bien journalisée avec le statut
   `accepted`.
4. Contrôle que l'email de confirmation part bien (Resend → **Emails**).
5. Fais enfin un test **réel** à montant minimal, puis rembourse-le depuis le
   tableau de bord CinetPay pour valider aussi le chemin de remboursement.

### 6.7 Ce que l'application fait de plus que le webhook

Pour éviter qu'un webhook forgé ou rejoué ne délivre un billet :

1. le webhook **déclenche** le traitement ;
2. le serveur appelle `POST /v2/payment/check` chez CinetPay et lit le **statut
   réel** ;
3. si la signature HMAC est présente, elle est vérifiée en temps constant et un
   écart est **journalisé** ;
4. la commande est marquée payée, puis les billets sont générés par une fonction
   SQL **idempotente** ;
5. l'email contenant les QR codes est envoyé.

Conséquence : même si quelqu'un découvre l'URL du webhook, il ne peut pas
s'offrir des billets.

---

## 7. Vercel (hébergement)

### 7.1 Créer le projet

1. Crée un compte sur **https://vercel.com** (connexion via GitHub recommandée).
2. **Add New → Project**, puis importe ton dépôt GitHub privé.
3. Vercel détecte Next.js automatiquement. **Ne modifie rien** :

   | Réglage | Valeur |
   |---|---|
   | Framework Preset | Next.js |
   | Build Command | `npm run build` |
   | Output Directory | `.next` |
   | Install Command | `npm install` |
   | Node.js Version | **22.x** (Settings → General) |

4. **Ne clique pas encore sur Deploy** : ajoute d'abord les variables.

### 7.2 Variables d'environnement

**Settings → Environment Variables**. Ajoute chaque variable pour **Production**,
**Preview** et **Development** selon la colonne indiquée :

| Nom | Valeur | Environnements |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://ton-domaine.ci` | Production |
| `NEXT_PUBLIC_APP_NAME` | `Rassemble` | Tous |
| `NEXT_PUBLIC_CURRENCY` | `XOF` | Tous |
| `PLATFORM_COMMISSION_RATE` | `0.05` | Tous |
| `PAYMENT_PROVIDER` | `cinetpay` | Production |
| `EMAIL_PROVIDER` | `resend` | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | *(étape 3.2)* | Tous |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(étape 3.2)* | Tous |
| `SUPABASE_SERVICE_ROLE_KEY` | *(étape 3.2)* | Production, Preview |
| `RESEND_API_KEY` | *(étape 5.3)* | Production |
| `EMAIL_FROM` | `Rassemble <billets@ton-domaine.ci>` | Production |
| `EMAIL_REPLY_TO` | `support@ton-domaine.ci` | Production |
| `CINETPAY_API_KEY` | *(étape 6.3)* | Production |
| `CINETPAY_SITE_ID` | *(étape 6.3)* | Production |
| `CINETPAY_SECRET_KEY` | *(étape 6.3)* | Production |
| `CINETPAY_BASE_URL` | `https://api-checkout.cinetpay.com` | Tous |
| `CINETPAY_CHANNELS` | `ALL` | Tous |
| `CRON_SECRET` | chaîne aléatoire longue | Production |

Pour générer un `CRON_SECRET` solide :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 7.3 Déployer

Clique sur **Deploy**. Vercel compile et expose l'application sur une URL du type
`ton-projet.vercel.app`. Vérifie qu'elle répond avant de brancher le domaine.

### 7.4 Brancher le domaine

**Settings → Domains → Add**, ajoute `ton-domaine.ci` et `www.ton-domaine.ci`.
Vercel indique les enregistrements à créer chez ton registrar :

| Type | Nom | Valeur |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

Attends la vérification : de quelques minutes à quelques heures. Le certificat
HTTPS est émis automatiquement.

### 7.5 Mettre à jour les URL côté prestataires

Une fois le domaine actif :

1. **Supabase** → Authentication → URL Configuration : `https://ton-domaine.ci`
   en *Site URL*, et `https://ton-domaine.ci/**` dans les *Redirect URLs*.
2. **CinetPay** → mets à jour l'URL du site si tu avais utilisé l'URL Vercel
   temporaire.
3. **Vercel** → vérifie `NEXT_PUBLIC_APP_URL`, puis **Redeploy**.

---

## 8. Premier administrateur

Les migrations ne créent aucun administrateur : il faut en promouvoir un.

1. Inscris-toi normalement sur l'application avec ton adresse.
2. Dans **Supabase → SQL Editor**, exécute :

   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin'
   from public.profiles
   where email = 'ton-adresse@exemple.com'
   on conflict (user_id, role) do nothing;
   ```

3. Déconnecte-toi puis reconnecte-toi : l'accès à `/admin` apparaît.

Un organisateur, lui, s'inscrit normalement puis crée son organisation depuis
l'interface.

---

## 9. Tests de bout en bout

Reproduis le scénario de validation du cahier des charges, dans cet ordre :

| # | Action | Attendu |
|---|---|---|
| 1 | Un organisateur crée un événement et ses billets | Visible après publication |
| 2 | Un visiteur non connecté ouvre la page événement | Détails, programme et billets visibles |
| 3 | Le visiteur s'inscrit puis achète un billet | Redirection CinetPay, paiement accepté |
| 4 | Retour sur la plateforme | Commande `paid`, billets générés, **email avec QR reçu** |
| 5 | Le participant ouvre son billet | QR affiché, statut « Valide » |
| 6 | Le participant accède au salon | **Membre automatiquement** |
| 7 | Il publie un message et une photo | Visibles immédiatement par les membres |
| 8 | Un second participant se connecte | Il peut demander une connexion |
| 9 | L'organisateur scanne le QR à l'entrée | ✅ « Accès autorisé » |
| 10 | Re-scan du même billet | ⚠️ « Ce billet a déjà été utilisé » |
| 11 | Scan d'un billet d'un autre événement | ❌ « appartient à un autre événement » |
| 12 | Tableau de bord organisateur | Ventes, entrées et revenus cohérents |
| 13 | Après l'événement | Salon accessible, historique conservé |

Tant que ces 13 étapes passent, le cœur du produit fonctionne.

---

## 10. Tâches planifiées

Les routes `/api/cron/*` sont protégées par `CRON_SECRET`. Déclare-les dans
`vercel.json`, ou via **Settings → Cron Jobs** :

```json
{
  "crons": [
    { "path": "/api/cron/event-reminders", "schedule": "0 8 * * *" },
    { "path": "/api/cron/expire-tickets", "schedule": "0 3 * * *" }
  ]
}
```

| Tâche | Rôle | Fréquence |
|---|---|---|
| `event-reminders` | Envoie le rappel aux participants la veille | quotidienne |
| `expire-tickets` | Expire les billets non payés, clôt les commandes abandonnées | quotidienne |

> Le plan Vercel **Hobby** n'autorise que **2 tâches, une fois par jour**. Pour des
> rappels plus fréquents, le plan **Pro** (environ 20 $/mois) est nécessaire.

Chaque appel doit présenter l'en-tête d'autorisation attendu :

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://ton-domaine.ci/api/cron/event-reminders
```

---

## 11. Sauvegardes et supervision

| Sujet | Recommandation |
|---|---|
| **Sauvegardes base** | Plan Supabase Pro : sauvegardes quotidiennes automatiques, restauration à un instant précis (PITR) en option |
| **Export supplémentaire** | `pg_dump` hebdomadaire vers un stockage externe |
| **Erreurs applicatives** | Sentry (`SENTRY_DSN`) — optionnel mais recommandé |
| **Disponibilité** | Pages de statut Supabase et Vercel, alertes email en cas d'incident |
| **Emails** | Surveiller **Resend → Metrics** : rebonds < 4 %, spam < 0,08 % |
| **Paiements** | Réconciliation mensuelle entre `Database → payments` et les relevés CinetPay |
| **Journal d'audit** | La table `audit_logs` conserve paiements, modération et actions d'administration |

---

## 12. Liste de contrôle finale

Avant d'annoncer l'ouverture :

- [ ] Migrations appliquées : `npm run db:push` sans erreur
- [ ] `npm run typecheck` et `npm run build` passent
- [ ] Plan Supabase **Pro** actif (aucune mise en pause possible)
- [ ] Domaine vérifié dans **Resend** et **Production Approval** obtenue
- [ ] Un email de test arrive en boîte de réception (pas en spam)
- [ ] Compte marchand **CinetPay** validé, canaux activés
- [ ] Un paiement réel de test a été effectué puis remboursé
- [ ] Webhook `/api/webhooks/cinetpay` joignable depuis Internet
- [ ] `CRON_SECRET` défini et tâches planifiées déclarées
- [ ] Un administrateur promu en base
- [ ] Un organisateur de test a créé un événement complet
- [ ] Les 13 étapes du scénario de bout en bout passent
- [ ] `SUPABASE_SERVICE_ROLE_KEY` **absente** du bundle navigateur
- [ ] Pages légales (CGU, confidentialité, mentions) relues et adaptées
- [ ] Sauvegardes vérifiées (une restauration testée)

---

## Annexe — Coûts mensuels indicatifs

| Poste | Plan | Coût |
|---|---|---|
| Supabase | Pro | ~25 $ |
| Vercel | Hobby (ou Pro pour les crons fréquents) | 0 $ (ou ~20 $) |
| Resend | Free (100 emails/jour) puis Pro | 0 $ (puis ~20 $) |
| Domaine | — | ~1 000 FCFA/mois lissé |
| CinetPay | Commission | ~1,5 % à 2 % par transaction |
| **Total fixe au démarrage** | | **~25 $ à 45 $/mois** |

Les commissions CinetPay sont variables et proportionnelles au chiffre
d'affaires, donc neutres tant qu'il n'y a pas de ventes.