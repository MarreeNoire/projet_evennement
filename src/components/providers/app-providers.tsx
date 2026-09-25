"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Toaster } from "sonner";

import { STORAGE_KEYS } from "@/lib/constants";

/* =============================================================================
   Gestion du thème (compatible React 19 / Next.js 16)
   --------------------------------------------------------------------------
   * Évite l'avertissement React 19 d'injection de <script> dans les Client Components.
   * Gère le basculement clair / sombre / système avec persistance localStorage.
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

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME) as Theme | null;
      if (saved && ["light", "dark", "system"].includes(saved)) {
        setThemeState(saved);
      }
    } catch {
      // Ignorer
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const getSystemTheme = () => (media.matches ? "dark" : "light");

    const applyTheme = (currentTheme: Theme) => {
      const sys = getSystemTheme();
      setSystemTheme(sys);

      const target = currentTheme === "system" ? sys : currentTheme;
      setResolvedTheme(target);

      const root = document.documentElement;
      if (target === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    applyTheme(theme);

    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    } catch {
      // Ignorer
    }
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
      {children}
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
    </ThemeProvider>
  );
}