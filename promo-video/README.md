# Publicité Event — motion design

Vidéo publicitaire de 24 s pour Event, déclinée en trois formats réseaux
sociaux. Le projet est autonome : il vit à côté de l'application Next.js et
réutilise ses jetons de marque (couleurs, polices, logo).

## Formats

| Composition      | Format  | Usage                                        |
| ---------------- | ------- | -------------------------------------------- |
| `EventPubVerticale` | 1080 × 1920 | Stories, Reels, TikTok, Shorts (master)   |
| `EventPubCarre`     | 1080 × 1080 | Fil Instagram / Facebook                  |
| `EventPubPaysage`   | 1920 × 1080 | YouTube, écrans, présentation             |

Durée : 723 images à 30 fps (24,03 s).

## Scènes

| # | Scène | Durée | Contenu |
| - | ----- | ----- | ------- |
| 01 | Accroche | 78 i. | « Tu organises un événement ? » + les quatre verbes |
| 02 | Marque | 96 i. | Logo, mot-symbole, promesse |
| 03 | Créer | 132 i. | Maquette de publication d'événement |
| 04 | Vendre | 132 i. | Billets FCFA, Mobile Money, compteur de ventes |
| 05 | Rassembler | 132 i. | Salon communautaire en direct |
| 06 | Accueillir | 96 i. | Contrôle d'accès QR |
| 07 | Signature | 141 i. | « Rejoins Event… », bouton Lien en bio |

Les six transitions font 14 images chacune : 807 − 84 = 723 images.
Les durées se règlent dans `src/theme.ts` (`SCENES`, `TRANSITION`) et le total
suit automatiquement dans `src/Root.tsx`.

## Prévisualiser

```bash
npm install
npm run dev
```

Le Studio s'ouvre sur `http://localhost:3000` (ou le port suivant disponible).

## Rendre un MP4

```bash
npx remotion render EventPubVerticale out/event-pub-verticale.mp4 \
  --codec=h264 --crf=18
```

Si le téléchargement du navigateur de rendu est bloqué, on peut utiliser Chrome
déjà installé :

```bash
npx remotion render EventPubVerticale out/event-pub-verticale.mp4 \
  --codec=h264 --crf=18 \
  --browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

Remplacer `EventPubVerticale` par `EventPubCarre` ou `EventPubPaysage` pour les
autres formats. Les mêmes commandes existent en scripts npm :
`npm run render`, `npm run render:carre`, `npm run render:paysage`.

## Bande son

La vidéo est volontairement muette : les réseaux sociaux la lisent sans son, et
la musique peut être ajoutée au montage final. Pour l'intégrer directement au
projet, déposer un fichier dans `public/` puis ajouter un `<Audio>` dans
`src/Promo.tsx` (par exemple `@remotion/media`).

## Structure

```
src/
  theme.ts            jetons de marque, durées
  motion.ts           aides d'animation (ressorts, courbes, compteurs)
  Promo.tsx           timeline TransitionSeries
  Root.tsx            les trois compositions
  scenes/             une scène par chapitre
  ui/                 logo, kit de mise en page, QR, décors
```
