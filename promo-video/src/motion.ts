/* =============================================================================
   Aides d'animation — tout est piloté par la frame, jamais par CSS.
   ========================================================================== */

import { Easing, interpolate, spring } from "remotion";

/** Courbe d'accélération « sortie rapide, arrivée douce » utilisée partout. */
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

/** Progression 0 → 1 entre `delay` et `delay + duration`. */
export const progress = (frame: number, delay: number, duration: number) =>
  EASE(clamp((frame - delay) / duration));

/** Apparition douce : opacité + montée verticale. */
export const enter = (frame: number, delay = 0, distance = 56, duration = 22) => {
  const p = progress(frame, delay, duration);
  return {
    opacity: p,
    translate: `0px ${Math.round((1 - p) * distance)}px`,
  };
};

/** Ressort fortement amorti — pas de rebond, parfait pour le texte. */
export const rise = (frame: number, fps: number, delay = 0, distance = 56) => {
  const s = spring({ frame, fps, delay, config: { damping: 200 } });
  return {
    opacity: s,
    translate: `0px ${(1 - s) * distance}px`,
    progress: s,
  };
};

/** Ressort avec rebond — pour les pastilles, badges et boutons. */
export const pop = (
  frame: number,
  fps: number,
  delay = 0,
  config: { damping?: number; stiffness?: number } = {},
) =>
  spring({
    frame,
    fps,
    delay,
    config: { damping: config.damping ?? 11, stiffness: config.stiffness ?? 180, mass: 0.9 },
  });

/** Texte qui s'écrit caractère par caractère (machine à écrire). */
export const typed = (text: string, frame: number, delay: number, charsPerFrame = 2) => {
  const count = Math.floor(clamp((frame - delay) * charsPerFrame, 0, text.length));
  return text.slice(0, count);
};

/** Compteur entier 0 → valeur. */
export const counter = (frame: number, delay: number, duration: number, value: number) =>
  Math.round(clamp((frame - delay) / duration) * value);

/** Oscillation lente et continue (respiration), en unités finies. */
export const breathe = (frame: number, amplitude = 1, periodInFrames = 90) =>
  Math.sin((frame / periodInFrames) * Math.PI * 2) * amplitude;

/** Bruit déterministe 0 → 1 à partir d'un entier (décors stables). */
export const pseudo = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Interpolation bornée des deux côtés, avec la courbe de marque. */
export const ramp = (
  frame: number,
  input: [number, number],
  output: [number, number],
  easing = true,
) =>
  interpolate(frame, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    ...(easing ? { easing: EASE } : {}),
  });
