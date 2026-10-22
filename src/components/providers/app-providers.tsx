"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import { Toaster } from "sonner";

import { STORAGE_KEYS } from "@/lib/constants";
import { PwaInstallProvider } from "@/components/providers/pwa-install-provider";
import { PwaUpdateToast } from "@/components/providers/pwa-update-toast";
import { PwaInstallBanner } from "@/components/layout/pwa-install-banner";

/* =============================================================================
   Gestion du thÃ¨me (compatible React 19 / Next.js 16)
   --------------------------------------------------------------------------
   * Ã‰vite l'avertissement React 19 d'injection de <script> dans les Client Components.
   * GÃ¨re le basculement clair / sombre / systÃ¨me avec persistance localStorage.
   ========================================================================== */

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  systemTheme: "light" | "dark";
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
  systemTheme: "light",
  themes: ["light", "dark", "system"],
});

const THEME_CHANGE_EVENT = "event:theme-change";
let fallbackTheme: Theme = "light";

function getStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) as Theme | null;
    return saved && ["light", "dark", "system"].includes(saved) ? saved : "light";
  } catch {
    return fallbackTheme;
  }
}

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function subscribeToSystemTheme(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore<Theme>(subscribeToTheme, getStoredTheme, () => "light");
  const systemTheme = useSyncExternalStore<"light" | "dark">(subscribeToSystemTheme, getSystemTheme, () => "light");
  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.classList.toggle("light", resolvedTheme === "light");
  }, [resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    fallbackTheme = newTheme;
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    } catch {
      // Ignorer
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
        systemTheme,
        themes: ["light", "dark", "system"],
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <PwaInstallProvider>
        {children}
        <PwaUpdateToast />
        <PwaInstallBanner />
        <Toaster
          position="top-center"
          closeButton
          richColors
          toastOptions={{
            classNames: {
              toast: "rounded-xl border border-border shadow-lg",
              title: "text-sm font-semibold",
              description: "text-sm text-fg-muted",
            },
          }}
        />
      </PwaInstallProvider>
    </ThemeProvider>
  );
}
