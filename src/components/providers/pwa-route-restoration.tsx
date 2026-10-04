"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const LAST_ROUTE_KEY = "event:pwa:last-route";
const ROUTE_TTL_MS = 24 * 60 * 60 * 1000;

function isStandalonePwa() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true)
  );
}

function readSavedRoute() {
  try {
    const saved = localStorage.getItem(LAST_ROUTE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as { route?: unknown; savedAt?: unknown };
    if (
      typeof parsed.route !== "string" ||
      !parsed.route.startsWith("/") ||
      parsed.route.startsWith("//") ||
      typeof parsed.savedAt !== "number" ||
      Date.now() - parsed.savedAt > ROUTE_TTL_MS
    ) {
      localStorage.removeItem(LAST_ROUTE_KEY);
      return null;
    }
    return parsed.route;
  } catch {
    return null;
  }
}

export function PwaRouteRestoration() {
  const pathname = usePathname();
  const router = useRouter();
  const restored = useRef(false);

  useEffect(() => {
    if (!isStandalonePwa()) {
      restored.current = true;
      return;
    }

    if (pathname === "/") {
      const savedRoute = readSavedRoute();
      if (savedRoute && savedRoute !== "/") {
        router.replace(savedRoute);
        return;
      }
    }

    restored.current = true;
  }, [pathname, router]);

  useEffect(() => {
    if (!restored.current || !isStandalonePwa()) return;

    const saveCurrentRoute = () => {
      try {
        const route = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (
          !route.startsWith("//") &&
          !route.startsWith("/auth/") &&
          !route.startsWith("/nouveau-mot-de-passe")
        ) {
          localStorage.setItem(LAST_ROUTE_KEY, JSON.stringify({ route, savedAt: Date.now() }));
        }
      } catch {
        // La PWA doit rester utilisable si le stockage du navigateur est bloqué.
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
