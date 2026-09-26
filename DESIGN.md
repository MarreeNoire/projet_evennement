---
name: Event
description: A social network for discovering and sharing events.
colors:
  rust-paper: "#60352c"
  rust-highlight: "#a26350"
  warm-paper: "#eee8de"
  page-paper: "#e4ddd1"
  night-ink: "#201f1d"
  raised-ink: "#292723"
  ticket-brass: "#85714e"
  moss: "#3d5c47"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3vw, 2.75rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  xs: "3px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "14px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "#60352c"
    textColor: "#ffffff"
    typography: "Inter, ui-sans-serif, system-ui, sans-serif; 600"
    rounded: "3px"
    padding: "0 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "#cec3b4"
    textColor: "#282622"
    rounded: "3px"
    padding: "0 16px"
    height: "44px"
  input:
    backgroundColor: "#eee8de"
    textColor: "#282622"
    rounded: "3px"
    padding: "10px 12px"
    height: "44px"
---

## Overview

**Le carnet des sorties.** Event relie une annonce d’événement aux personnes qui y participent et aux conversations de son salon. Son vocabulaire visuel vient des programmes imprimés, des talons de billets et des panneaux de salle. La mise en page éditoriale garde l’événement au centre et donne à Event une présence différente d’un fil social généraliste. Les deux thèmes partagent ce caractère mat, sans dégradés, transparence décorative ni halos colorés.

## Colors

Le papier chaud et l’encre charbon assurent une lecture confortable en clair comme en sombre. La terre cuite désaturée signale les actions principales, la sélection active et les dates. Le laiton atténué marque les niveaux de billet ; la mousse et le bleu-gris restent réservés aux états sémantiques. Les couleurs de statut sont toujours accompagnées d’un libellé lisible.

## Typography

Inter est auto-hébergée par Next.js et utilisée sur l’ensemble du produit. Les titres ont une chasse resserrée et des paliers nets. Le corps reste à 16px, les contrôles et libellés secondaires à 14px, et les métadonnées compactes à 12px minimum, hors repère décoratif non textuel.

## Layout

Le contenu est centré dans une largeur maximale de 80rem, avec des marges réactives et de vrais espaces entre les sections. Les pages participants privilégient la découverte et les salons. Les cartes événement présentent la couverture fournie par l’organisateur, une date détachée, le lieu et le tarif réel. Les publications d’un salon se lisent comme des notes liées à un événement, dans une colonne continue. Les outils organisateur gardent une densité adaptée à chaque tâche.

## Elevation & Depth

Les bordures et les changements de ton séparent les surfaces. Les ombres restent réservées aux menus et panneaux superposés. Aucun flou décoratif, verre dépoli ou halo coloré.

## Shapes

Les boutons, champs, cartes et badges utilisent des angles rectangulaires courts (de 3 à 12px). Les avatars, indicateurs ronds et repères circulaires de billet gardent leur forme fonctionnelle. Les boutons restent rectangulaires.

## Components

- **Action principale.** Remplissage terre cuite, libellé contrasté, focus clavier visible et états désactivé ou chargement distincts.
- **Annonce d’événement.** Image réelle fournie par l’organisateur si disponible, date lisible, lieu et tarif issus des données.
- **Publication de salon.** Colonne de lecture, règles fines et fond papier. Les annonces d’organisateur ont une teinte discrète.
- **Navigation.** Les libellés identifient les sections ; un filet étroit marque la page active. La navigation mobile a un fond opaque.
- **Recherche et formulaires.** Libellés persistants, contour lisible et focus clavier visible.

## Do's and Don'ts

- Utiliser uniquement des événements, médias et détails d’organisateur présents dans l’application.
- Ne pas inventer d’avis, de clients, de volumes d’audience, de ventes ou de statistiques.
- Ne pas ajouter de photo générée par IA, de promesse promotionnelle vague, d’emoji icône, de dégradé violet ni de bouton pilule.
- Maintenir le contraste WCAG 2.2 AA, l’accès clavier, la réduction des animations, l’affichage mobile et la prise en charge du contraste forcé.
