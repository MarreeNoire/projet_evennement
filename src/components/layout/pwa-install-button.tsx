"use client";

import { Download, Plus, Share2, X } from "lucide-react";
import { useState } from "react";

import { usePwaInstall } from "@/components/providers/pwa-install-provider";

export function PwaInstallButton() {
  const { canInstall, installed, promptInstall } = usePwaInstall();
  const [helpOpen, setHelpOpen] = useState(false);
  const isIos =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

  if (installed) return null;

  async function handleInstall() {
    if (!canInstall) {
      setHelpOpen((open) => !open);
      return;
    }

    try {
      await promptInstall();
      setHelpOpen(false);
    } catch {
      setHelpOpen(true);
    }
  }

  return (
    <div className="w-full">
      {helpOpen ? (
        <section
          id="install-help-panel"
          aria-labelledby="install-help-title"
          className="bg-surface border-border mb-3 border p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 id="install-help-title" className="text-fg text-sm font-bold">
              Installer Event sur ce téléphone
            </h2>
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="text-fg-muted hover:text-fg -mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center"
              aria-label="Fermer les instructions"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          {canInstall ? (
            <p className="text-fg-muted mt-2 text-sm leading-relaxed">
              L’installation directe est prête. Touche <strong>Installer l’application</strong> pour
              ouvrir la confirmation Android.
            </p>
          ) : isIos ? (
            <p className="text-fg-muted mt-2 text-sm leading-relaxed">
              Dans Safari, touche <Share2 className="mx-0.5 inline size-4" aria-hidden="true" />
              <span className="sr-only">Partager</span>, puis <strong>Sur l’écran d’accueil</strong>.
            </p>
          ) : isAndroid ? (
            <p className="text-fg-muted mt-2 text-sm leading-relaxed">
              Chrome n’a pas encore activé l’installation directe. Garde Event ouvert au moins 30
              secondes, puis réessaie. L’application doit être ouverte sur une adresse HTTPS et ne
              pas déjà être installée.
            </p>
          ) : (
            <p className="text-fg-muted mt-2 text-sm leading-relaxed">
              Dans le menu de ton navigateur, choisis <strong>Installer l’application</strong> ou
              <strong> Ajouter à l’écran d’accueil</strong>.
            </p>
          )}
        </section>
      ) : null}
      <button
        type="button"
        onClick={handleInstall}
        aria-expanded={helpOpen}
        aria-controls="install-help-panel"
        className="text-fg hover:bg-bg-muted focus-visible:ring-primary-solid inline-flex min-h-11 w-full items-center justify-center gap-2 border border-border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {canInstall ? (
          <Download className="size-4" aria-hidden="true" />
        ) : isIos ? (
          <Plus className="size-4" aria-hidden="true" />
        ) : (
          <Download className="size-4" aria-hidden="true" />
        )}
        {canInstall ? "Installer l’application" : "Installer Event"}
      </button>
    </div>
  );
}
