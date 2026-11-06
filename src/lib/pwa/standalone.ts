/* ============================================================================
   Détection « application installée »
   --------------------------------------------------------------------------
   Une PWA lancée depuis l'écran d'accueil s'affiche en mode `standalone` :
   pas de barre d'adresse, pas d'onglets. On s'en sert pour alléger l'accueil
   (ni hero ni navbar), sans jamais toucher à la version web.

   Le hook `useSyncExternalStore` de React garantit un premier rendu identique
   au serveur (`false`) puis une bascule côté client : aucun avertissement
   d'hydratation, et le CSS masque déjà les blocs avant l'hydratation.
   ========================================================================== */

/** Abonnement aux changements de mode d'affichage. */
export function subscribeToStandalone(onChange: () => void): () => void {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** `true` dans la fenêtre autonome d'une PWA installée (iOS compris). */
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone === true;
}

/** Valeur renvoyée pendant le rendu serveur et l'hydratation. */
export function serverStandaloneSnapshot(): boolean {
  return false;
}
