/* =============================================================================
   Jetons de marque « Event » — repris de src/app/globals.css (thème clair).
   Une seule source de vérité pour les couleurs, les polices et les durées.
   ========================================================================== */

export const COLORS = {
  bg: "#f7f4ee",
  bgSubtle: "#eee9e1",
  bgMuted: "#e6e0d7",
  surface: "#fffdfa",
  surfaceRaised: "#ffffff",

  fg: "#202a35",
  fgMuted: "#53606a",
  fgSubtle: "#6c777e",
  border: "rgba(32, 42, 53, 0.11)",
  borderStrong: "rgba(32, 42, 53, 0.2)",

  primary: "#b83f22",
  primaryDeep: "#96331e",
  primarySubtle: "#f6dfd4",
  primarySubtleFg: "#672d20",

  accent: "#425dc6",
  accentSolid: "#3e56ba",
  accentSubtle: "#e4e9ff",

  gold: "#edc85f",
  goldDeep: "#d5a638",

  success: "#137333",
  successSolid: "#22c55e",
  successSubtle: "#dcfce7",

  white: "#ffffff",

  /* Affiches de couverture (poster-1 … poster-5). */
  posters: ["#3e51a8", "#a8432c", "#286d7c", "#8b6927", "#4b435f"],
} as const;

export const FONTS = {
  sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  display: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
} as const;

export const SHADOWS = {
  card: "0 16px 40px rgba(32, 42, 53, 0.12)",
  floating: "0 30px 80px rgba(32, 42, 53, 0.18)",
  pill: "0 8px 24px rgba(32, 42, 53, 0.08)",
  deep: "0 40px 100px rgba(32, 42, 53, 0.22)",
} as const;

/* ---------------------------------------------------------------------------
   Durées (images à 30 fps). Six transitions de 14 images : la composition
   dure 807 − 84 = 723 images, soit 24,1 s.
--------------------------------------------------------------------------- */

export const SCENES = {
  hook: 78,
  brand: 96,
  create: 132,
  tickets: 132,
  salon: 132,
  checkIn: 96,
  cta: 141,
} as const;

export const TRANSITION = 14;

export const TOTAL_DURATION =
  SCENES.hook +
  SCENES.brand +
  SCENES.create +
  SCENES.tickets +
  SCENES.salon +
  SCENES.checkIn +
  SCENES.cta -
  6 * TRANSITION;
