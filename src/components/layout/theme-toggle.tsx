"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { useTheme } from "@/components/providers/app-providers";

import { cn } from "@/lib/utils";

/* =============================================================================
   Sélecteur de thème
   --------------------------------------------------------------------------
   Groupe de boutons radio « clair / sombre / système ». On évite le bouton
   unique qui alterne sans indiquer l'état choisi : l'utilisateur doit voir
   l'option active.

   Le rendu initial est différé jusqu'au montage : le serveur ne connaît pas la
   préférence stockée localement, afficher un état puis le changer provoquerait
   un décalage visuel.
   ========================================================================== */

const OPTIONS = [
  { value: "light", label: "Clair", Icon: Sun },
  { value: "dark", label: "Sombre", Icon: Moon },
  { value: "system", label: "Système", Icon: Monitor },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div
      role="radiogroup"
      aria-label="Apparence"
      className={cn(
        "inline-flex items-center gap-1 border border-border-strong bg-bg-muted p-1",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const isActive = mounted && theme === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-sm transition-colors duration-150",
              isActive
                ? "bg-surface text-primary shadow-xs"
                : "text-fg-subtle hover:text-fg",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
