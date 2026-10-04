"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const LAST_ROUTE_KEY = "event:pwa:last-route";
const LAST_ROUTE_COOKIE = "event_pwa_last_route";
const ROUTE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function isStandalonePwa() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true)
  );
}

function persistRoute(route: string) {
  const savedAt = Date.now();
  const value = JSON.stringify({ route, savedAt });
  try {
    localStorage.setItem(LAST_ROUTE_KEY, value);
  } catch {
    // Le cookie suffit à rétablir la route au démarrage de la PWA.
  }
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const encodedRoute = encodeURIComponent(route);
  if (encodedRoute.length <= 3800) {
    document.cookie = `${LAST_ROUTE_COOKIE}=${encodedRoute}; Path=/; Max-Age=${Math.floor(ROUTE_TTL_MS / 1000)}; SameSite=Lax${secure}`;
  } else {
    document.cookie = `${LAST_ROUTE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  }
}

export function PwaRouteRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isStandalonePwa()) return;

    const saveCurrentRoute = () => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("pwa_start");
        const route = `${url.pathname}${url.search}${url.hash}`;
        if (
          !route.startsWith("//") &&
          !route.startsWith("/auth/") &&
          !route.startsWith("/nouveau-mot-de-passe") &&
          route.length <= 3500
        ) {
          persistRoute(route);
        }
      } catch {
        // La PWA reste utilisable si le stockage du navigateur est bloqué.
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") saveCurrentRoute();
    };

    saveCurrentRoute();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", saveCurrentRoute);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", saveCurrentRoute);
    };
  }, [pathname]);

  return null;
}
