"use client";

import { useEffect } from "react";

function isStandalonePwa() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true)
  );
}

/** Enregistre le service worker PWA une seule fois. */
function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .then((registration) => {
      // Vérifier silencieusement les mises à jour du SW
      registration.update().catch(() => {});
    })
    .catch((err) => {
      // Ne pas bloquer l'app si le SW ne s'enregistre pas
      console.warn("[PWA] Service worker non enregistré :", err);
    });
}

export function PwaRouteRestoration() {
  useEffect(() => {
    document.body.classList.toggle("pwa-standalone", isStandalonePwa());
  }, []);

  // Enregistrer le service worker une seule fois au montage
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
