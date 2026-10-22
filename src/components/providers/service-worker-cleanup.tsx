"use client";

import { useEffect } from "react";

/* =============================================================================
   Nettoyage de l'ancien socle PWA
   --------------------------------------------------------------------------
   L'application est un site web : elle ne doit plus enregistrer de service
   worker ni conserver les caches de l'ancienne version installable. Ce composant
   nettoie les navigateurs qui ont déjà l'ancien worker et supprime les caches
   obsolètes, pour éviter de servir une ancienne page HTML avec de nouveaux
   assets après un déploiement.
   ========================================================================== */

export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    void navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister())),
      )
      .catch(() => {
        /* Navigation privée ou contexte non sécurisé : rien à nettoyer. */
      });

    if ("caches" in window) {
      void caches
        .keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .catch(() => {
          /* Le stockage peut être indisponible ; le site reste utilisable. */
        });
    }
  }, []);

  return null;
}
