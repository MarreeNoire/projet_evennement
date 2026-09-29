"use client";

import { Download, Plus, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && navigator.standalone === true);
    setInstalled(standalone);
    setIsIos(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setHelpOpen(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (installed) return null;

  async function handleInstall() {
    if (!installPrompt) {
      setHelpOpen((open) => !open);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  }

  return (
    <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-50 sm:right-6 sm:bottom-6">
      {helpOpen ? (
        <section
          id="install-help-panel"
          aria-labelledby="install-help-title"
          className="bg-surface border-border-strong mb-3 w-[min(20rem,calc(100vw-2rem))] border p-4 shadow-lg"
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
          {isIos ? (
            <p className="text-fg-muted mt-2 text-sm leading-relaxed">
              Dans Safari, touche <Share2 className="mx-0.5 inline size-4" aria-hidden="true" />
              <span className="sr-only">Partager</span>, puis <strong>Sur l’écran d’accueil</strong>.
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
        className="bg-primary-solid text-primary-solid-fg hover:bg-primary-solid-hover focus-visible:ring-primary-solid inline-flex min-h-11 items-center gap-2 border border-transparent px-4 text-sm font-semibold shadow-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {installPrompt ? (
          <Download className="size-4" aria-hidden="true" />
        ) : isIos ? (
          <Plus className="size-4" aria-hidden="true" />
        ) : (
          <Download className="size-4" aria-hidden="true" />
        )}
        Installer l’application
      </button>
    </div>
  );
}
