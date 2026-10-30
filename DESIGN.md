---
name: Event — Papier & verre
description: Interface éditoriale et franche pour découvrir des sorties et rejoindre leur communauté en Côte d'Ivoire, posée sur du verre plutôt que des aplats opaques.
colors:
  ink: "#0B0B0C"
  paper: "#F4F2EC"
  mint: "#E0F9E4"
  mint-deep: "#1E5A37"
  paper-deep: "#E4E0D6"
  line: "#B9B5AA"
  muted-ink: "#55524B"
typography:
  display:
    fontFamily: "Anton, Arial Narrow, Impact, sans-serif"
    fontWeight: 400
    letterSpacing: "0.004em"
    lineHeight: 0.92
    case: uppercase
  body:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
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
    style: "scène encre avec vidéo voilée, halo de menthe, bandeau défilant et panneaux de verre"
    structure: "navigation de verre · bandeau · titre Anton · actions · composition centrée"
  event-card:
    style: "billet de verre : affiche, pastille de date en menthe, filet perforé, prix composté"
  navigation:
    style: "chrome de verre translucide, flou réel, liseré clair, cibles tactiles de 44 px"
---

## Direction artistique

La maquette `accueil/Application de billetterie et salons4.html` fixe le vocabulaire : encre `#0B0B0C`, papier `#F4F2EC`, gris chaud `#55524B`, titres Anton en capitales, texte Bricolage Grotesque, filets francs et blocs éditoriaux. L'accent vient de `exemple_couleur` : un vert menthe très clair, `#E0F9E4`, mesuré sur l'image de référence. `#1E5A37` est une dérivation du même vert, assombrie pour porter le texte sur le papier clair.

L'écart assumé avec la maquette est le verre. Les aplats opaques deviennent des surfaces translucides : fond à 7 à 12 % sur l'encre, 60 à 78 % sur le papier, flou de 18 à 22 px, saturation à 1,4, liseré clair en haut et ombre douce. Le verre n'est jamais décoratif : il sert à garder le contenu lisible au-dessus d'une vidéo, d'une affiche ou d'une trame.

### Principes

- L'encre porte les grandes surfaces ; le papier porte la lecture longue ; la menthe reste un accent d'action et de repère, jamais un fond de page.
- Un seul aplat de menthe par vue : bouton principal, pastille de date ou état actif. Le reste est encre, papier ou verre.
- Les contours sont fins (1 px sur le verre, 2 px sur les actions) et les ombres sont douces. Les ombres dures de type affiche ne servent qu'aux boutons principaux, au survol.
- Les titres sont courts et en capitales Anton. Les données, lieux, horaires et tarifs restent en Bricolage Grotesque, jamais en display.
- Aucune donnée inventée : les compteurs, la prochaine sortie et la jauge viennent des événements réellement publiés. Une base vide affiche un état vide explicite.

### Verre et replis

- `backdrop-filter` est toujours doublé d'un repli opaque pour les navigateurs qui ne le prennent pas en charge.
- `prefers-reduced-transparency: reduce` remplace le verre par une surface pleine et coupe le flou.
- Le texte ne doit jamais reposer sur une zone de verre sans voile derrière : sur la scène d'accueil, un dégradé d'encre garantit le contraste du titre et des actions.

### Parcours

1. L'accueil pose la promesse et le bandeau, puis laisse la place aux sorties réelles dans les cartes-billets.
2. La sélection « À l'affiche » reprend les vrais événements dans les cartes-billets.
3. L'exploration garde les mêmes cartes, les mêmes filtres et les mêmes états.
4. Les salons, billets et écrans organisateur héritent des mêmes jetons de couleur et de la même typographie.
5. Les écrans denses (organisateur, administration) gardent la hiérarchie serrée, sans verre superflu.

### Mouvement et retour

- Entrée du hero : montée de 14 px sur 620 ms, décalée de 40 à 420 ms selon l'ordre de lecture.
- Bandeau : défilement linéaire continu, mis en pause au survol.
- Survol des cartes : élévation de 6 px, reflet qui balaie l'affiche, contour qui prend la menthe. Retour à l'état initial dès que le pointeur sort.
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
