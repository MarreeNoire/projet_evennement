/* =============================================================================
   Retour haptique léger (navigator.vibrate)
   --------------------------------------------------------------------------
   No-op silencieux partout où l'API n'existe pas (iOS Safari global, desktop).
   Réservé aux actions importantes : navigation par onglets, confirmation,
   erreur bloquante. Jamais dans des boucles ni sur un simple hover.
   ========================================================================== */

export type HapticPattern = "light" | "medium" | "success";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 8,
  medium: 24,
  success: [12, 48, 12],
};

export function haptic(pattern: HapticPattern = "light"): void {
  if (typeof navigator === "undefined") return;
  const vibrate = navigator.vibrate;
  if (typeof vibrate !== "function") return;

  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    // Certains navigateurs sémantiques jettent sur vibrate — ignorer.
  }
}
