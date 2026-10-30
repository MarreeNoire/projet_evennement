---
name: Event — Verre liquide & bento
description: Interface événementielle éditoriale, avec surfaces de verre liquide, compositions bento et volumes doux.
colors:
  ink: "#22231F"
  paper: "#F4F0E8"
  vermilion: "#BD3B25"
  cobalt: "#344D67"
  gold: "#EDC55C"
  line: "#D8D2C7"
  muted-ink: "#73736C"
  dark-background: "#0A0E0C"
  dark-surface: "#111714"
  dark-ink: "#EAF3E7"
  dark-primary: "#A7F432"
  dark-accent: "#3B8F7B"
typography:
  display:
    fontFamily: "Archivo, Arial, sans-serif"
    fontWeight: 700
    letterSpacing: "-0.05em"
    lineHeight: 0.92
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "80px"
components:
  hero:
    style: "titre géant, halo 3D doux et couverture réelle dans un cadre de verre"
    structure: "navigation flottante · titre éditorial · action principale · événement en vedette"
  event-card:
    style: "carte bento arrondie : affiche, date et tarif dans une surface vitrée"
  navigation:
    style: "chrome flottant translucide, flou réel et cibles tactiles de 44 px"
  surfaces:
    style: "verre dépoli avec repli opaque, liseré clair et ombre diffuse"
---

## Direction artistique

La référence visuelle apporte quatre idées : verre liquide, grilles bento, typographie géante et volumes 3D doux. Event les adapte à sa palette : encre `#22231F`, papier `#F4F0E8`, vermillon `#BD3B25`, cobalt `#344D67` et or `#EDC55C`. Les titres Archivo et le texte Inter restent cohérents avec les polices chargées par l'application.

Le thème sombre conserve sa palette existante, plus forestière : fond `#0A0E0C`,
surfaces `#111714`, texte `#EAF3E7`, vert principal `#A7F432` et accent
`#3B8F7B`. Seul le thème initial passe au papier ; le choix déjà enregistré
reste prioritaire.

Les surfaces translucides gardent assez d'opacité pour assurer le contraste : flou de 18 à 22 px, liseré clair et ombre douce. Les volumes doux viennent de dégradés CSS et des couvertures fournies par les organisateurs ; aucune photo d'événement générée n'est ajoutée.

### Principes

- Le papier porte la lecture longue ; l'encre structure les titres ; le vermillon et le cobalt signalent les actions et repères.
- Les surfaces bento regroupent des contenus liés, sans ajouter de chiffres ou d'informations fictives.
- Les contours sont fins (1 px sur le verre, 2 px sur les actions) et les ombres sont douces.
- Les titres sont courts et expressifs. Les données, lieux, horaires et tarifs restent en Inter, jamais en display.
- Aucune donnée inventée : les compteurs, la prochaine sortie et la jauge viennent des événements réellement publiés. Une base vide affiche un état vide explicite.

### Verre et replis

- `backdrop-filter` est toujours doublé d'un repli opaque pour les navigateurs qui ne le prennent pas en charge.
- `prefers-reduced-transparency: reduce` remplace le verre par une surface pleine et coupe le flou.
- Le texte ne repose pas sur une zone vitrée sans voile : les cartes photo utilisent un dégradé d'encre, tandis que le titre reste sur le papier.

### Parcours

1. L'accueil pose la promesse et laisse la place aux sorties réelles dans les cartes-billets.
2. La sélection « À l'affiche » reprend les vrais événements dans les cartes bento.
3. L'exploration garde les mêmes cartes, les mêmes filtres et les mêmes états.
4. Les salons, billets et écrans organisateur héritent des mêmes jetons de couleur et de la même typographie.
5. Les écrans denses (organisateur, administration) gardent la hiérarchie serrée, sans verre superflu.

### Mouvement et retour

- Entrée du hero : montée de 14 px sur 620 ms, décalée de 40 à 420 ms selon l'ordre de lecture.
- Bandeau : défilement linéaire continu, mis en pause au survol.
- Survol des cartes : élévation de 4 px, reflet discret sur l'affiche et contour qui prend l'accent. Retour à l'état initial dès que le pointeur sort.
- Cibles tactiles autour de 44 px, appui immédiat, transitions de 160 à 380 ms.
- `prefers-reduced-motion: reduce` neutralise toutes les animations et conserve les états finaux lisibles.

### Accueil — direction éditoriale

L'accueil reprend la référence ivoire et architecturale sans la copier : espace
respirant, image d'événement réelle dans une arche, titre contrasté avec un mot
en sérif italique Georgia, et une seule action principale. Cette sérif système
est une exception propre au hero ; les autres titres conservent la police
display du produit. Le titre reste fluide selon la largeur d'écran. Quand
aucune couverture n'est disponible, une composition abstraite aux tons sable
remplace la photo sans inventer d'événement.

Le parcours commence par le hero, enchaîne directement sur les événements
publiés, puis propose les raccourcis de compte. Les blocs de bénéfices répétés
sont retirés : salons, billetterie et organisateurs gardent chacun leur section
dédiée. Le nombre d'événements affiché dans le hero provient du total chargé
côté serveur.

L'entrée du hero est limitée à l'opacité et à la transformation, avec une
variante sans déplacement sous `prefers-reduced-motion`. La zone « À l'affiche »
fait défiler les événements chargés toutes les huit secondes. Les commandes
précédent/suivant et pause/reprise restent visibles ; le défilement s'arrête au
survol, à la prise de focus, lorsque la zone sort de l'écran ou si la réduction
des animations est demandée. La sélection manuelle reste disponible dans tous
les cas.
