"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";

import { STORAGE_KEYS } from "@/lib/constants";

/* =============================================================================
   Providers globaux
   --------------------------------------------------------------------------
   * next-themes : thème clair / sombre / système, sans flash au chargement.
     `attribute="class"` correspond au sélecteur `.dark` défini dans globals.css.
   * sonner : notifications transitoires, alignées sur le design system.
   ========================================================================== */

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey={STORAGE_KEYS.THEME}
    >
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
      
    </NextThemesProvider>
  );
}