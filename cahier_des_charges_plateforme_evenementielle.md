# Cahier de conception — Plateforme événementielle et communautaire

## 1. Vision générale

Le projet consiste à créer une plateforme événementielle combinant :

1. découverte d'événements ;
2. réservation et billetterie ;
3. création automatique d'un salon communautaire lié à chaque événement ;
4. discussion entre participants ;
5. partage de photos et contenus ;
6. recherche de participants avec contrôle de visibilité ;
7. networking et mise en relation ;
8. gestion opérationnelle complète pour les organisateurs.

### Concept central

> **Découvrir → acheter/participer → entrer dans le salon de l'événement → échanger avant/pendant/après → conserver la communauté et les souvenirs.**

L'idée différenciante est de ne pas être uniquement une plateforme de billetterie.

Chaque événement devient une **communauté temporaire ou durable**.

---

# 2. Proposition de valeur

## Pour les participants

L'application permet de :

- découvrir des événements ;
- rechercher des événements ;
- consulter les détails ;
- acheter un billet ou réserver gratuitement ;
- recevoir un billet numérique avec QR code ;
- rejoindre automatiquement le salon de l'événement ;
- discuter avec les autres participants ;
- publier des photos et vidéos ;
- commenter et réagir ;
- participer à des sondages ;
- poser des questions à l'organisateur ;
- consulter le programme ;
- retrouver des participants ;
- créer des connexions ;
- recevoir des notifications ;
- continuer les échanges après l'événement.

## Pour les organisateurs

L'organisateur peut :

- créer un événement ;
- créer et administrer son salon ;
- créer plusieurs catégories de billets ;
- vendre des tickets ;
- gérer les participants ;
- publier le programme ;
- envoyer des annonces ;
- modérer le salon ;
- scanner les tickets ;
- suivre les entrées ;
- gérer une équipe ;
- publier des photos ;
- consulter les statistiques ;
- suivre les ventes et les revenus.

---

# 3. Problème métier

Dans le parcours événementiel classique, les usages sont souvent fragmentés :

- découverte → réseaux sociaux / sites ;
- billet → plateforme de ticketing ;
- communication → WhatsApp / Telegram ;
- programme → PDF ou site ;
- photos → galerie ou réseaux sociaux ;
- networking → rencontres informelles.

La plateforme vise à réunir ces usages dans une seule expérience.

---

# 4. Positionnement

Le produit ne doit pas être présenté simplement comme :

> « Une application pour acheter des tickets. »

Positionnement recommandé :

> **« La plateforme où l'on découvre un événement, y participe et rencontre sa communauté avant, pendant et après. »**

La billetterie devient le **point d'entrée** dans le salon.

---

# 5. Les cinq piliers du produit

## ① DISCOVER

Découvrir des événements.

## ② BOOK

Réserver ou acheter un billet.

## ③ ENTER

Présenter son billet et entrer.

## ④ CONNECT

Rencontrer les autres participants.

## ⑤ REMEMBER

Conserver les photos, discussions, connexions et souvenirs après l'événement.

---

# 6. Acteurs du système

## 6.1 Visiteur

Utilisateur non connecté.

Peut :

- consulter les événements publics ;
- rechercher ;
- voir les informations publiques ;
- créer un compte.

## 6.2 Participant

Utilisateur inscrit à un événement.

Peut :

- accéder au salon ;
- consulter les participants selon leurs préférences de visibilité ;
- publier ;
- commenter ;
- participer aux activités ;
- se connecter à d'autres participants.

## 6.3 Organisateur

Créateur de l'événement.

Peut :

- créer ;
- vendre ;
- gérer ;
- communiquer ;
- modérer ;
- consulter les statistiques.

## 6.4 Co-organisateur

Membre de l'équipe d'un organisateur.

Les permissions sont limitées selon le rôle qui lui est attribué.

## 6.5 Agent de contrôle

Personnel chargé du contrôle d'accès.

Peut :

- scanner un billet ;
- rechercher un billet ;
- valider/refuser une entrée.

## 6.6 Modérateur

Peut :

- traiter les signalements ;
- masquer/supprimer certains contenus ;
- bloquer ou restreindre des comptes selon les permissions.

## 6.7 Administrateur plateforme

Gère :

- utilisateurs ;
- organisateurs ;
- événements ;
- paiements ;
- commissions ;
- signalements ;
- modération ;
- catégories ;
- litiges ;
- statistiques globales.

---

# 7. Types de salons

## 7.1 Salon public

Accessible à tous selon les règles de l'organisateur.

## 7.2 Salon privé

Accessible uniquement aux personnes autorisées.

## 7.3 Salon événementiel

Salon associé automatiquement à un événement.

## 7.4 Salon VIP

Accessible selon le type de billet.

Exemple :

- Standard → salon principal ;
- VIP → salon principal + salon VIP.

## 7.5 Salon récurrent

Une communauté permanente liée à une organisation ou un thème.

Exemple :

> Communauté Entrepreneurs Abidjan

Cette communauté peut organiser plusieurs événements au fil du temps.

---

# 8. Fonctionnalités principales

## 8.1 Découverte d'événements

L'accueil peut proposer :

- événements populaires ;
- événements proches ;
- événements de la semaine ;
- événements à venir ;
- nouvelles publications liées aux événements ;
- événements recommandés ;
- catégories ;
- recherche.

### Catégories possibles

- concerts ;
- conférences ;
- formations ;
- networking ;
- sport ;
- culture ;
- humour ;
- festivals ;
- entreprises ;
- associations ;
- étudiants ;
- technologie ;
- mode ;
- gastronomie ;
- autres.

---

# 9. Recherche avancée

Recherche par :

- nom d'événement ;
- nom d'organisateur ;
- lieu ;
- catégorie ;
- date ;
- prix.

### Recherche de participant

Un utilisateur peut rechercher un participant uniquement si ce dernier a choisi d'être visible.

Le profil peut utiliser :

- nom ;
- pseudonyme ;
- nom affiché.

Aucune donnée sensible comme l'adresse ou le numéro de téléphone ne doit être exposée.

---

# 10. Billetterie

Chaque événement possède un ou plusieurs types de billets.

### Exemple

| Ticket | Prix | Quantité |
|---|---:|---:|
| Early Bird | 5 000 FCFA | 500 |
| Standard | 10 000 FCFA | 2 000 |
| VIP | 25 000 FCFA | 300 |
| VVIP | 50 000 FCFA | 100 |

Chaque type de billet peut avoir :

- un nom ;
- un prix ;
- une quantité ;
- une date de début ;
- une date de fin ;
- une limite par acheteur ;
- un niveau d'accès ;
- des avantages.

---

# 11. Cycle de vie d'un billet

Statuts possibles :

- `pending`
- `paid`
- `cancelled`
- `refunded`
- `used`
- `expired`

### Flux

```text
Order
   ↓
Confirmation paiement
   ↓
Génération du ticket
   ↓
QR code unique
   ↓
Scan à l'entrée
   ↓
Validation serveur
   ↓
CHECKED-IN
```

Avant de valider l'entrée, le serveur vérifie notamment :

- existence du ticket ;
- appartenance à l'événement ;
- paiement confirmé ;
- statut valide ;
- absence de scan précédent ;
- absence d'annulation.

---

# 12. Création automatique du salon

Après confirmation de l'achat ou de l'inscription :

```text
Paiement confirmé
      ↓
Ticket généré
      ↓
Droits d'accès déterminés
      ↓
Ajout au salon
      ↓
Notification utilisateur
```

Le salon peut être accessible avant, pendant et après l'événement selon les paramètres de l'organisateur.

---

# 13. Salon événementiel

Le salon constitue le coeur communautaire de la plateforme.

## Navigation

- Accueil
- Discussion
- Participants
- Photos
- Programme
- Infos
- Activités

## En-tête

- photo de couverture ;
- nom de l'événement ;
- date ;
- notifications ;
- menu d'actions ;
- nombre de participants.

---

# 14. Discussion

Le salon doit proposer un fil de discussion, pas uniquement un chat.

### Fonctionnalités

- publications ;
- commentaires ;
- réponses ;
- réactions ;
- mentions ;
- publications épinglées ;
- annonces officielles ;
- signalement.

### Exemples

> « Qui vient depuis Yopougon ? »

> « Quel sujet voulez-vous absolument voir ? »

> « À quelle heure commence la conférence ? »

---

# 15. Messagerie privée

Depuis le profil d'un participant :

- Se connecter ;
- Envoyer une demande ;
- Bloquer ;
- Signaler.

La messagerie privée peut fonctionner après acceptation d'une connexion, selon les règles de confidentialité choisies.

---

# 16. Fonction « Retrouver une personne »

Exemple :

```text
🔎 Rechercher un participant

Koffi
```

Résultat :

```text
Koffi A.
Développeur
Participant à Abidjan Tech Conference
```

### Contrôles de confidentialité

Chaque utilisateur doit pouvoir :

- autoriser ou désactiver la recherche ;
- choisir les informations visibles ;
- bloquer une personne ;
- signaler une personne.

---

# 17. Fonction « J'ai rencontré cette personne »

Pendant l'événement, un participant peut créer rapidement une connexion avec une autre personne.

### Exemple

1. ouvrir « Mon badge » ;
2. afficher un QR code personnel ;
3. l'autre participant scanne ;
4. la relation est créée.

Cela évite de devoir connaître le nom exact de la personne.

---

# 18. Networking

Section :

> **Rencontrez des personnes**

Exemple de profil :

```text
Koffi A.
Développeur
Abidjan

🚀 Technologie
💼 Entrepreneuriat
🎨 Design

3 intérêts communs
2 événements communs

[Se connecter]
```

Le système peut proposer des participants ayant :

- des intérêts communs ;
- des événements communs ;
- des connexions communes.

---

# 19. Photos et souvenirs

## Fonctionnalités

- publication de photos ;
- publication de vidéos selon limites techniques ;
- commentaires ;
- réactions ;
- signalement ;
- suppression de ses propres contenus.

## Albums

Exemples :

- Avant l'événement ;
- Jour 1 ;
- Jour 2 ;
- After party.

---

# 20. Programme interactif

Le programme doit être consultable directement dans l'application.

### Exemple

```text
09:00
Accueil

10:00
Ouverture

11:00
Conférence React

13:00
Pause

14:00
Atelier

16:00
Networking
```

L'utilisateur peut :

- enregistrer une session ;
- ajouter une session à son programme personnel ;
- recevoir un rappel ;
- consulter les détails du speaker.

---

# 21. Sondages

L'organisateur peut créer des sondages.

Exemple :

> Quel sujet voulez-vous demain ?

- A
- B
- C

Les résultats peuvent être affichés en temps réel.

---

# 22. Questions / réponses

Fonction particulièrement utile pour :

- conférences ;
- formations ;
- panels ;
- séminaires.

Les participants peuvent :

- poser une question ;
- voter pour une question ;
- voir les questions populaires ;
- consulter les réponses.

---

# 23. Marketplace événementielle

À terme, un organisateur peut vendre :

- T-shirts ;
- goodies ;
- repas ;
- ateliers ;
- parking ;
- expériences VIP ;
- produits numériques.

Cela transforme progressivement la plateforme en écosystème événementiel.

---

# 24. Covoiturage

Exemple :

> 🚗 Je pars de Yopougon vers 17h30.

Les participants peuvent se déclarer disponibles.

Cette fonctionnalité nécessite des règles strictes de confidentialité et de sécurité.

---

# 25. Fonction « Objets trouvés »

Le salon peut contenir :

> « Téléphone trouvé près de l'entrée. »

Cette section doit être modérée.

---

# 26. Notifications

Types de notifications :

- nouveau message ;
- réponse ;
- mention ;
- nouveau participant ;
- événement bientôt ;
- billet disponible ;
- changement d'horaire ;
- annonce organisateur ;
- sondage ;
- demande de connexion.

Prévoir des préférences de notification afin d'éviter la surcharge.

---

# 27. Check-in

L'organisateur dispose d'un écran :

> **Scanner un billet**

Résultats possibles :

### ✅ Billet valide

Afficher :

- participant ;
- type de billet ;
- heure ;
- accès autorisé.

### ❌ Billet invalide

### ⚠️ Billet déjà utilisé

Prévoir aussi une recherche manuelle par :

- nom ;
- email ;
- référence du billet.

---

# 28. Dashboard organisateur

## Vue générale

Exemple :

```text
Ventes
35 200 000 FCFA

Tickets vendus
2 430

Participants attendus
2 430

Entrées
1 850

Taux de remplissage
92 %
```

## Graphiques

- ventes par jour ;
- ventes par type de ticket ;
- revenus ;
- participants ;
- check-in ;
- sources de trafic ;
- activité du salon.

---

# 29. Gestion des billets

L'organisateur peut :

- créer un ticket ;
- modifier le prix ;
- modifier les quotas ;
- programmer la mise en vente ;
- arrêter la vente ;
- définir les limites par personne ;
- associer des privilèges ;
- créer des tickets VIP/VVIP.

---

# 30. Codes promotionnels

Exemple :

```text
STARTUP20
```

Permet :

- réduction en pourcentage ;
- réduction fixe ;
- accès spécial ;
- quantité limitée ;
- période de validité.

---

# 31. Parrainage

Exemple :

```text
Utilisateur A
      ↓
invite B
      ↓
B achète
      ↓
A reçoit un crédit
```

Le crédit peut être utilisé sur un futur événement ou selon les règles commerciales de la plateforme.

---

# 32. Réputation et badges

Ne pas attribuer publiquement une note aux participants sans mécanisme solide.

À la place, envisager des badges tels que :

- Profil vérifié ;
- Organisateur vérifié ;
- Participant régulier ;
- Ambassadeur ;
- Organisateur expérimenté.

Pour les organisateurs, afficher éventuellement :

- nombre d'événements organisés ;
- nombre de participants ;
- historique ;
- indicateurs de satisfaction lorsque disponibles.

---

# 33. Écrans publics

## 33.1 Splash screen

Contient :

- logo ;
- animation courte ;
- chargement.

## 33.2 Onboarding

Exemples :

1. Découvrez ;
2. Participez ;
3. Rencontrez ;
4. Rejoignez.

## 33.3 Connexion

- email ou téléphone ;
- mot de passe ;
- récupération ;
- connexion via fournisseur externe selon choix technique.

## 33.4 Inscription

- nom ;
- pseudo ;
- email ;
- téléphone ;
- mot de passe ;
- photo optionnelle ;
- centres d'intérêt.

## 33.5 Accueil

Structure proposée :

```text
Bonjour 👋

🔎 Rechercher un événement

Événements près de vous

[Carte événement]

Populaires

[Carte événement]

Ce week-end

[Carte événement]

Pour vous

[Carte événement]
```

## 33.6 Explorer

Filtres :

- date ;
- catégorie ;
- prix ;
- lieu ;
- distance.

## 33.7 Détail événement

Contient :

- image ;
- nom ;
- organisateur ;
- date ;
- heure ;
- lieu ;
- description ;
- programme ;
- participants ;
- tickets ;
- partage ;
- bouton d'achat.

---

# 34. Écran paiement

## Récapitulatif

- billet ;
- quantité ;
- sous-total ;
- frais ;
- total.

## Paiement

Prévoir les moyens de paiement compatibles avec le marché ciblé, notamment :

- mobile money ;
- carte bancaire ;
- autres méthodes selon le prestataire choisi.

---

# 35. Écran « Mes billets »

Exemple :

```text
Mes billets

[Abidjan Tech Conference]
12 octobre 2027

VIP

[ QR CODE ]

Voir le billet
```

---

# 36. Écran « Mes salons »

```text
Mes salons

● Tech Conference
● Concert Abidjan
● Networking Entrepreneurs
● Formation React
```

---

# 37. Écran du salon

```text
[Photo événement]

Abidjan Tech Conference
438 participants

Accueil | Discussion | Participants | Photos | Programme

--------------------------------

Publications

« Qui vient demain ? »

❤️ 24
💬 8

--------------------------------

Écrire quelque chose...
📷  📹  📊  @
```

---

# 38. Écran Participants

```text
438 participants

🔎 Rechercher

Koffi A.
Développeur

Aminata K.
Designer

...
```

---

# 39. Écran Profil

Exemple :

```text
PHOTO

Koffi A.

Développeur
Abidjan

🚀 Technologie
💼 Entrepreneuriat

Événements participés : 18

[Se connecter]
```

L'utilisateur doit contrôler quelles informations sont visibles.

---

# 40. Écran Découvrir des personnes

Suggestions basées sur :

- intérêts communs ;
- événements communs ;
- connexions communes.

Exemple :

```text
3 intérêts communs
2 événements communs

[Se connecter]
```

---

# 41. Écran Photos

Galerie en grille :

```text
[PHOTO] [PHOTO] [PHOTO]

[PHOTO] [PHOTO] [PHOTO]
```

Actions :

- like ;
- commentaire ;
- partage ;
- signalement.

---

# 42. Écran Programme

Chronologie :

```text
09:00  Accueil
10:00  Ouverture
11:30  Conférence
12:30  Pause
14:00  Atelier
16:00  Networking
```

---

# 43. Écran Notifications

Sections :

### Aujourd'hui

- Koffi a répondu à votre publication.
- Nouveau message dans Tech Conference.
- L'événement commence dans 2 heures.

---

# 44. Création d'événement

Créer l'événement sous forme d'un assistant en plusieurs étapes.

## Étape 1 — Informations

- nom ;
- description ;
- catégorie.

## Étape 2 — Visuel

- image de couverture ;
- galerie éventuelle.

## Étape 3 — Date

- début ;
- fin ;
- horaires.

## Étape 4 — Lieu

- adresse ;
- ville ;
- coordonnées ;
- lien éventuel.

## Étape 5 — Billets

- types ;
- prix ;
- quotas ;
- dates de vente.

## Étape 6 — Programme

- sessions ;
- horaires ;
- speakers.

## Étape 7 — Salon

- confidentialité ;
- participants visibles ou non ;
- contenu autorisé ;
- accès VIP.

## Étape 8 — Publication

- aperçu ;
- validation ;
- publier.

---

# 45. Dashboard administrateur

## Utilisateurs

- recherche ;
- filtres ;
- vérification ;
- blocage ;
- restrictions.

## Événements

- publiés ;
- en attente ;
- terminés ;
- supprimés ;
- signalés.

## Paiements

- transactions ;
- remboursements ;
- commissions ;
- anomalies.

## Modération

- publications signalées ;
- photos signalées ;
- comptes signalés ;
- messages signalés.

---

# 46. Architecture fonctionnelle

```text
                    APPLICATION
                         │
          ┌──────────────┼──────────────┐
          │              │              │
      Découverte      Billetterie     Social
          │              │              │
      Événements       Tickets        Salons
          │              │              │
      Recherche       Paiement       Discussion
          │              │              │
       Filtres          QR           Photos
                         │           Participants
                         │           Networking
                         │
                    Organisateur
                         │
                    Dashboard
                         │
                     Analytics
```

---

# 47. Modèle de données

## User

```text
id
name
username
email
phone
passwordHash
avatar
bio
interests
visibility
createdAt
```

## Event

```text
id
organizerId
title
description
coverImage
category
location
startDate
endDate
status
capacity
createdAt
```

## TicketType

```text
id
eventId
name
price
quantity
sold
saleStart
saleEnd
accessLevel
```

## Order

```text
id
userId
eventId
amount
paymentMethod
paymentStatus
transactionId
createdAt
```

## Ticket

```text
id
orderId
eventId
userId
ticketTypeId
qrCode
status
checkedInAt
```

## Salon

```text
id
eventId
name
privacy
createdAt
```

## SalonMember

```text
id
salonId
userId
role
joinedAt
```

## Post

```text
id
salonId
authorId
content
media
createdAt
```

## Comment

```text
id
postId
authorId
content
createdAt
```

## Connection

```text
id
senderId
receiverId
status
createdAt
```

## Message

```text
id
conversationId
senderId
content
readAt
createdAt
```

## Notification

```text
id
userId
type
title
body
read
createdAt
```

---

# 48. Relations principales

```text
USER
 │
 ├── crée ──> EVENT
 │
 ├── achète ──> TICKET
 │
 ├── rejoint ──> SALON
 │
 ├── publie ──> POST
 │
 ├── commente ──> COMMENT
 │
 ├── se connecte ──> USER
 │
 └── échange ──> MESSAGE

EVENT
 │
 ├── possède ──> TICKET TYPES
 │
 ├── possède ──> TICKETS
 │
 ├── possède ──> SALON
 │
 ├── possède ──> PROGRAMME
 │
 └── possède ──> PHOTOS
```

---

# 49. API backend — proposition

```text
POST   /api/auth/register
POST   /api/auth/login

GET    /api/events
POST   /api/events
GET    /api/events/:id
PUT    /api/events/:id
DELETE /api/events/:id

GET    /api/events/:id/tickets
POST   /api/orders
GET    /api/tickets/me

GET    /api/salons
GET    /api/salons/:id
POST   /api/salons/:id/posts

GET    /api/salons/:id/members
GET    /api/users/search

POST   /api/connections
GET    /api/connections

POST   /api/messages
GET    /api/conversations

POST   /api/checkin
POST   /api/reports
```

---

# 50. Temps réel

Utiliser une technologie WebSocket telle que Socket.IO pour :

- messages ;
- nouveaux commentaires ;
- notifications ;
- réactions ;
- sondages ;
- présence en ligne ;
- mises à jour du nombre de participants ;
- événements live.

---

# 51. Design UI/UX

## Direction artistique

Objectif :

- premium ;
- moderne ;
- visuel ;
- simple ;
- mobile-first.

### Recommandations

- fond clair ou mode sombre ;
- cartes avec angles arrondis ;
- images très présentes ;
- typographie moderne comme Inter ou Manrope ;
- boutons facilement utilisables sur mobile ;
- navigation inférieure sur mobile.

## Navigation mobile

```text
Accueil
Explorer
Mes billets
Salons
Profil
```

---

# 52. Carte événement

Exemple :

```text
┌──────────────────────────┐
│                          │
│       IMAGE EVENT        │
│                          │
├──────────────────────────┤
│ 🔥 Populaire             │
│                          │
│ Abidjan Tech Conference  │
│ 📅 12 octobre            │
│ 📍 Cocody                │
│ 👥 438 participants      │
│                          │
│ À partir de 10 000 FCFA  │
└──────────────────────────┘
```

---

# 53. Principe UX essentiel

Le parcours principal doit être évident :

```text
Découvrir
   ↓
Événement
   ↓
Réserver
   ↓
Paiement
   ↓
Ticket
   ↓
Salon
```

L'utilisateur ne doit pas avoir à chercher longtemps la prochaine action.

---

# 54. Sécurité

## Authentification

- hash sécurisé des mots de passe ;
- sessions ou tokens sécurisés ;
- expiration ;
- récupération de compte.

## Autorisation

Rôles :

```text
USER
ORGANIZER
CO_ORGANIZER
MODERATOR
CHECKIN_AGENT
ADMIN
```

Chaque rôle dispose de permissions différentes.

## Paiement

Ne jamais stocker inutilement les données bancaires sensibles.

## Billets

Chaque QR code doit être unique et vérifié côté serveur.

---

# 55. Protection de la vie privée

Prévoir dès la V1 :

- paramètres de visibilité ;
- possibilité de ne pas apparaître dans la recherche de participants ;
- possibilité de bloquer ;
- possibilité de signaler ;
- contrôle de la visibilité du profil ;
- absence d'exposition publique du téléphone ou de l'adresse ;
- suppression du compte et gestion des données.

---

# 56. Modération

Fonctions :

- Signaler ;
- Bloquer ;
- Supprimer ;
- Masquer ;
- Restreindre ;
- Suspendre.

### Motifs de signalement

- spam ;
- harcèlement ;
- contenu inapproprié ;
- fraude ;
- faux événement ;
- usurpation ;
- autre.

---

# 57. Anti-fraude

Le système de validation de ticket doit contrôler côté serveur :

```text
ticket exists?
ticket belongs to event?
ticket paid?
ticket already used?
ticket cancelled?
ticket expired?
```

Un ticket déjà utilisé doit être refusé.

---

# 58. Business model

## 58.1 Commission sur tickets

Exemple fictif :

Ticket = 10 000 FCFA

Commission plateforme = 5 %

Commission = 500 FCFA

Le taux réel dépendra du modèle commercial et des coûts de paiement.

## 58.2 Offre Premium Organisateur

### Gratuit

- création d'événement ;
- billetterie basique ;
- salon basique.

### Pro

- statistiques avancées ;
- branding ;
- export ;
- automatisations ;
- marketing ;
- équipes ;
- fonctions avancées.

### Enterprise

Pour :

- grandes entreprises ;
- conférences ;
- salons professionnels ;
- universités ;
- associations.

## 58.3 Services sponsorisés

- événements sponsorisés ;
- mise en avant dans les résultats ;
- campagnes partenaires.

## 58.4 Marketplace

À terme :

- DJ ;
- photographe ;
- traiteur ;
- décorateur ;
- sécurité ;
- matériel ;
- salles.

---

# 59. Fonctionnalités IA futures

## 59.1 Création automatique d'événement

L'organisateur écrit par exemple :

> « Je veux organiser une conférence sur l'entrepreneuriat à Abidjan le 15 novembre. »

L'IA peut proposer :

- titre ;
- description ;
- programme ;
- FAQ ;
- posts marketing ;
- emails ;
- suggestions de catégories.

## 59.2 Assistant événement

Un assistant peut répondre à :

- horaires ;
- programme ;
- localisation ;
- parking ;
- règles ;
- informations officielles.

Il doit s'appuyer sur les données de l'événement.

## 59.3 Recommandations

Recommander des événements selon :

- centres d'intérêt ;
- événements consultés ;
- événements passés ;
- localisation ;
- comportement dans l'application.

L'utilisateur doit pouvoir gérer ses préférences.

---

# 60. Marketplace de services événementiels

À terme, permettre aux organisateurs de trouver :

- salles ;
- photographes ;
- vidéastes ;
- DJ ;
- traiteurs ;
- décorateurs ;
- agents de sécurité ;
- sociétés de sonorisation ;
- entreprises de transport ;
- imprimeurs.

La plateforme devient alors un **écosystème événementiel**.

---

# 61. KPI

## Acquisition

`visiteurs → inscriptions`

## Conversion

`visiteurs événement → achats`

## Activation

`acheteurs → utilisateurs ayant rejoint le salon`

## Engagement

`participants actifs / participants`

## Social

`connexions créées / événement`

## Rétention

`utilisateurs revenant après un événement`

## Business

- volume des tickets ;
- revenus plateforme ;
- commission moyenne ;
- valeur moyenne de commande ;
- nombre d'organisateurs actifs.

---

# 62. MVP V1

Il ne faut pas développer toutes les fonctionnalités immédiatement.

La première version doit se concentrer sur :

## Utilisateurs

- inscription ;
- connexion ;
- profil.

## Événements

- création ;
- consultation ;
- recherche ;
- détails.

## Billetterie

- types de tickets ;
- commande ;
- paiement ;
- ticket numérique ;
- QR code.

## Salons

- accès automatique ;
- publications ;
- commentaires ;
- annonces.

## Participants

- liste ;
- recherche avec contrôle de visibilité ;
- profils.

## Photos

- publication simple ;
- suppression ;
- signalement.

## Organisateur

- dashboard basique ;
- ventes ;
- participants ;
- gestion des tickets.

## Check-in

- scanner QR ;
- validation serveur ;
- statut d'utilisation.

## Administration

- utilisateurs ;
- événements ;
- signalements.

---

# 63. V2

Ajouter :

- chat privé ;
- demandes de connexion ;
- programme interactif ;
- notifications avancées ;
- sondages ;
- coupons ;
- parrainage ;
- statistiques avancées ;
- équipe organisateur ;
- albums photo.

---

# 64. V3

Ajouter :

- networking intelligent ;
- IA ;
- marketplace ;
- recommandations avancées ;
- badges ;
- gamification ;
- sponsoring ;
- application mobile native ;
- API publique ;
- intégrations avec des services tiers.

---

# 65. Architecture technique recommandée

Pour le projet :

```text
Frontend
Next.js + TypeScript
        │
        ↓
Backend API
Node.js + Express ou NestJS
        │
        ├── PostgreSQL
        │
        ├── Redis
        │
        ├── WebSocket
        │
        ├── Stockage images
        │
        ├── Service email
        │
        └── Paiement
```

PostgreSQL est particulièrement adapté car le domaine contient de nombreuses relations entre :

- utilisateurs ;
- événements ;
- tickets ;
- commandes ;
- salons ;
- membres ;
- publications ;
- commentaires ;
- connexions ;
- messages.

---

# 66. Architecture logique

```text
                    FRONTEND
                  Next.js / React
                         │
                         ▼
                    API BACKEND
                 Node.js / Express
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
   PostgreSQL          Redis           WebSocket
       │                                   │
       │                                   ▼
       │                            Chats / Live
       │
       ├── Users
       ├── Events
       ├── Tickets
       ├── Orders
       ├── Salons
       ├── Posts
       ├── Comments
       └── Connections
```

---

# 67. Parcours utilisateur complet

```text
Téléchargement
      ↓
Inscription
      ↓
Choix des intérêts
      ↓
Accueil personnalisé
      ↓
Découverte événement
      ↓
Page événement
      ↓
Choix billet
      ↓
Paiement
      ↓
Billet QR
      ↓
Salon événement
      ↓
Présentation aux participants
      ↓
Discussion
      ↓
Networking
      ↓
Événement
      ↓
Check-in
      ↓
Photos
      ↓
Connexions
      ↓
Souvenirs
      ↓
Recommandations
      ↓
Prochain événement
```

---

# 68. Boucle de croissance du produit

La logique à long terme doit être :

```text
Événement
    ↓
Communauté
    ↓
Connexions
    ↓
Souvenirs
    ↓
Retour dans l'application
    ↓
Nouvel événement
```

Le produit ne dépend ainsi pas uniquement de la vente d'un billet.

---

# 69. Stratégie de lancement

Il est préférable de commencer par un marché précis.

### Phase 1

Événements à Abidjan.

### Phase 2

Côte d'Ivoire.

### Phase 3

Afrique francophone.

### Phase 4

Afrique.

### Phase 5

International.

L'objectif est de valider l'usage et le comportement des utilisateurs avant de multiplier les marchés.

---

# 70. Structure finale du produit

## Application utilisateur

```text
Accueil
Explorer
Mes billets
Mes salons
Connexions
Notifications
Profil
```

## Espace organisateur

```text
Dashboard
Événements
Billetterie
Salons
Participants
Check-in
Messages
Photos
Marketing
Analytics
Paiements
Équipe
Paramètres
```

---

# 71. Règles métier principales

1. Un utilisateur doit être authentifié pour accéder aux salons privés.
2. Un utilisateur ne peut accéder à un salon événementiel que s'il dispose des droits correspondants.
3. Un billet non payé ne peut pas être utilisé pour entrer.
4. Un billet annulé ou remboursé ne peut pas être utilisé.
5. Un billet déjà consommé ne peut pas être réutilisé.
6. Les droits VIP doivent être liés au type de billet.
7. Un participant peut contrôler sa visibilité dans la recherche.
8. Un participant peut bloquer un autre utilisateur.
9. Toute donnée sensible doit rester privée.
10. Les actions d'administration doivent être protégées par RBAC.
11. Les contenus signalés doivent pouvoir être examinés par les personnes autorisées.
12. Les opérations financières doivent être journalisées.
13. Les actions de check-in doivent être enregistrées.
14. Un organisateur ne doit gérer que ses événements et ceux pour lesquels il possède une permission explicite.
15. La suppression d'un événement doit respecter les règles de remboursement et de conservation des données.

---

# 72. Critères de réussite du MVP

Le MVP doit permettre de réaliser intégralement ce scénario :

```text
1. Un organisateur crée un événement.
2. Il définit les tickets.
3. L'événement est publié.
4. Un utilisateur découvre l'événement.
5. Il achète un billet.
6. Le paiement est confirmé.
7. Son billet QR est généré.
8. Il obtient accès au salon.
9. Il consulte les participants.
10. Il publie un message.
11. Il consulte les photos.
12. Il rencontre des personnes.
13. Son billet est scanné à l'entrée.
14. L'organisateur voit le check-in dans son dashboard.
15. Après l'événement, le salon reste accessible selon les règles définies.
```

Si ce scénario fonctionne parfaitement, le coeur du produit existe.

---

# 73. Feuille de route de développement

## Phase 0 — Conception

- spécifications ;
- parcours ;
- wireframes ;
- modèle de données ;
- architecture ;
- règles métier.

## Phase 1 — Fondations

- projet frontend ;
- backend ;
- base de données ;
- authentification ;
- gestion des rôles.

## Phase 2 — Événements

- création ;
- listing ;
- recherche ;
- détails.

## Phase 3 — Billetterie

- tickets ;
- commandes ;
- paiement ;
- QR.

## Phase 4 — Salons

- accès ;
- membres ;
- posts ;
- commentaires ;
- notifications.

## Phase 5 — Check-in

- scanner ;
- validation ;
- historique.

## Phase 6 — Organisateur

- dashboard ;
- statistiques ;
- gestion des tickets ;
- gestion des participants.

## Phase 7 — Modération

- signalements ;
- blocage ;
- administration.

## Phase 8 — Tests

- tests unitaires ;
- tests API ;
- tests E2E ;
- sécurité ;
- tests de charge.

## Phase 9 — Déploiement

- frontend ;
- API ;
- base de données ;
- stockage ;
- monitoring ;
- sauvegardes.

---

# 74. Résumé stratégique

Le produit repose sur trois briques fortement intégrées :

```text
          PLATEFORME
              │
       ┌──────┼──────┐
       │      │      │
   ÉVÉNEMENT TICKET COMMUNAUTÉ
       │      │      │
       └──────┼──────┘
              │
            SALON
```

Le véritable concept différenciateur est :

> **Chaque événement devient une communauté.**

La billetterie permet l'accès.

Le salon crée l'engagement.

Le networking crée la valeur sociale.

Les photos et discussions créent les souvenirs.

Les événements suivants créent la rétention.

---

# 75. Prochaine spécification technique à produire

La prochaine étape de conception devrait transformer ce document métier en spécification technique détaillée comprenant :

- architecture exacte du monorepo ;
- stack finale ;
- schéma PostgreSQL ;
- ERD ;
- routes API complètes ;
- contrats JSON des API ;
- architecture WebSocket ;
- système d'authentification ;
- RBAC détaillé ;
- système de paiement ;
- stockage des images ;
- stratégie de notifications ;
- wireframes de chaque écran ;
- composants frontend ;
- états loading / empty / error ;
- règles de validation ;
- tests ;
- CI/CD ;
- déploiement ;
- monitoring ;
- sécurité ;
- backlog priorisé ;
- tickets de développement.

Ce document pourra ensuite servir de **base de référence pour le développement de la V1**.
