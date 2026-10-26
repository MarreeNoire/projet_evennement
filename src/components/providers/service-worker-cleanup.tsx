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

    const hadController = Boolean(navigator.serviceWorker.controller);
    const reloadKey = "event_sw_cleanup_reloaded";

    void (async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }

        /* Un worker déjà actif contrôle encore la page courante après
           unregister(). Recharge une seule fois pour demander les assets au
           serveur et abandonner le document potentiellement mis en cache. */
        if (hadController) {
          if (sessionStorage.getItem(reloadKey) !== "1") {
            sessionStorage.setItem(reloadKey, "1");
            window.location.reload();
          }
        } else {
          sessionStorage.removeItem(reloadKey);
        }
      } catch {
        /* Stockage ou contexte sécurisé indisponible : le site reste utilisable. */
      }
    })();
  }, []);

  return null;
}
