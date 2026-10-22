"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/* =============================================================================
   Toast de mise à jour PWA
   --------------------------------------------------------------------------
   Le service worker installé attend (waiting) tant que l'utilisateur n'a pas
   confirmé. On écoute :
   - `updatefound` : le nouveau SW commence à s'installer,
   - `statechange` → `installed` : il est prêt, mais l'ancien contrôle encore
     la page (condition "application déposée" déjà chargée),
   - `registration.waiting` présent au montage : mise à jour déjà en attente.

   Le bouton « Actualiser » envoie `SKIP_WAITING` au SW en attente (message
   traité dans public/sw.js) puis recharge dès que le nouveau SW prend la
   main (controllerchange). Rien n'est fait automatiquement — c'est le modèle
   demandé : l'utilisateur garde le choix.
   ========================================================================== */

export function PwaUpdateToast() {
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const notify = (reg: ServiceWorkerRegistration | null) => {
      if (notifiedRef.current) return;
      if (!reg?.waiting) return;
      notifiedRef.current = true;

      toast("Nouvelle version disponible", {
        description: "Actualiser pour profiter des derniers changements.",
        duration: Infinity,
        action: {
          label: "Actualiser",
          onClick: () => {
            navigator.serviceWorker.addEventListener("controllerchange", () => {
              window.location.reload();
            });
            reg.waiting?.postMessage("SKIP_WAITING");
          },
        },
      });
    };

    navigator.serviceWorker.ready
      .then((reg) => {
        notify(reg);

        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              notify(reg);
            }
          });
        });
      })
      .catch(() => {
        /* Aucun SW (dev sans https) — rien à faire. */
      });
  }, []);

  return null;
}
