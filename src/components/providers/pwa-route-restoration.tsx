"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();

  useEffect(() => {
    const isPwa = isStandalonePwa();
    document.body.classList.toggle("pwa-standalone", isPwa);

    if (
      !isPwa ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;

    const targets = document.querySelectorAll<HTMLElement>(
      [
        "main > section",
        "main > div > section",
        "main > div.space-y-5 > section",
        "main > div.space-y-5 > div.grid > *",
        "main .event-card-reveal",
        "main .event-grid > *",
        "main article",
        "main [data-scroll-reveal]",
      ].join(","),
    );

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          target.dataset.pwaReveal = "visible";
          observer.unobserve(target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    targets.forEach((target) => {
      if (target.dataset.pwaReveal === "visible") return;
      const siblingIndex = Array.prototype.indexOf.call(target.parentElement?.children ?? [], target);
      target.style.setProperty("--pwa-reveal-delay", `${Math.min(siblingIndex * 55, 220)}ms`);
      target.dataset.pwaReveal = "pending";
      observer.observe(target);
    });

    return () => observer.disconnect();
  }, [pathname]);

  // Enregistrer le service worker une seule fois au montage
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
