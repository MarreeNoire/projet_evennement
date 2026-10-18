---
name: Event
description: A social network for discovering and sharing events.
colors:
  void: "#211e2c"
  night-surface: "#302c3d"
  raised-surface: "#3a354a"
  mint: "#e1fae5"
  green: "#d0f3d6"
  green-light: "#e1fae5"
  green-button: "#8ed89c"
  green-ink: "#163b22"
  fuchsia: "#985a8a"
  cyan: "#8bcad2"
  moonlight: "#f6f4fa"
  page-light: "#f5f3fa"
  white: "#ffffff"
typography:
  display:
    fontFamily: "Syne, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  caption:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.45
  small:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.5
  pwa-heading:
    fontFamily: "Syne, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.1
rounded:
  xs: "4px"
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "18px"
  2xl: "24px"
  scrollbar-thumb: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "#8ed89c"
    textColor: "#163b22"
    typography: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif; 600"
    rounded: "6px"
    padding: "0 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "#343043"
    textColor: "#f6f4fa"
    rounded: "6px"
    padding: "0 16px"
    height: "44px"
  input:
    backgroundColor: "#302c3d"
    textColor: "#f6f4fa"
    rounded: "6px"
    padding: "10px 12px"
    height: "44px"
---

## Overview

Event relie la découverte d’événements, la billetterie et les salons où les participants échangent avant, pendant et après une rencontre. Sa direction visuelle « Nuit électrique » associe un fond aubergine adouci à des accents vert menthe et fuchsia, des surfaces vitrées discrètes et une typographie expressive.

## Colors

Le thème sombre est la présentation par défaut : fond aubergine, surfaces décalées en luminosité, texte clair et accents vert menthe/fuchsia. Le vert menthe de référence est `#E1FAE5`; les accents principaux sont éclaircis vers le blanc, tandis que les boutons utilisent un vert pastel un peu plus soutenu (`#8ED89C`) avec un texte vert foncé. Le cyan reste un accent ponctuel. Les couleurs de réussite, d’alerte, d’erreur et d’information restent distinctes. Le thème clair utilise des surfaces légèrement teintées de vert.

## Typography

Syne porte les titres de page et les noms d’événements. Plus Jakarta Sans assure le corps de texte, les formulaires, les tableaux et les commandes. Les métadonnées restent lisibles sur petit écran, et les chiffres de prix ou de billets utilisent des chiffres tabulaires.

## Layout

Les parcours utilisent une structure familière : navigation supérieure ou latérale, contenu principal, filtres au-dessus des listes, et commandes proches de la tâche. La découverte peut respirer davantage ; les tableaux de bord conservent une densité qui facilite le suivi des événements, billets, participants, accès et paiements. Sur mobile et dans la PWA, la navigation reste accessible sans masquer le contenu.

## Elevation & Depth

Les cartes et panneaux utilisent des surfaces légèrement translucides avec un flou discret lorsque le contenu passe dessous. Des lueurs diffuses et une texture animée créent l’ambiance ; les ombres restent légères pour que les surfaces ne paraissent pas noires. Les apparitions au défilement guident le regard et respectent `prefers-reduced-motion`.

## Components

- **Action principale.** Accent vert lisible, bord rectangulaire, états de chargement, désactivé, focus et survol cohérents.
- **Événement.** Couverture fournie par l’organisateur, date, lieu, tarif réel et accès rapide aux détails.
- **Publication de salon.** Colonne de lecture sur une surface discrète, réponses clairement hiérarchisées.
- **Navigation.** Contrôles familiers, état actif visible, panneau mobile et barre de navigation PWA lisibles sur le fond nocturne.
- **Formulaires.** Libellés persistants, surfaces opaques suffisantes sous le texte, contour de focus visible.
- **QR codes.** Conservent un fond blanc uni pour rester scannables sur les écrans des billets et badges.

## Do’s and Don’ts

Utiliser uniquement les événements, médias et informations fournis par les organisateurs et les participants. Ne pas inventer d’avis, de clients, de volumes d’audience, de ventes ou de statistiques. Maintenir le contraste, l’accès clavier, le thème clair et les préférences de réduction des animations. Les QR codes conservent un fond blanc uni pour rester scannables.

Utiliser uniquement les événements, médias et informations fournis par les organisateurs et les participants. Ne pas inventer d’avis, de clients, de volumes d’audience, de ventes ou de statistiques. Maintenir le contraste WCAG 2.2 AA, l’accès clavier, le thème clair, les préférences de réduction des animations et les modes de contraste renforcé.
