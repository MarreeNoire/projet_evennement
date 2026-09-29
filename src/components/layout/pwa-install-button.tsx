"use client";

import { Download, Plus, Share2, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function subscribeToInstallState(onChange: () => void) {
  const displayMode = window.matchMedia("(display-mode: standalone)");
  displayMode.addEventListener("change", onChange);
  window.addEventListener("appinstalled", onChange);
  return () => {
    displayMode.removeEventListener("change", onChange);
    window.removeEventListener("appinstalled", onChange);
  };
}

function getInstallState() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true)
  );
}

function getServerInstallState() {
  return false;
}

export function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [didInstall, setDidInstall] = useState(false);
  const isStandalone = useSyncExternalStore(
    subscribeToInstallState,
    getInstallState,
    getServerInstallState,
  );
  const installed = isStandalone || didInstall;
  const isIos =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setDidInstall(true);
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
    if (choice.outcome === "accepted") setDidInstall(true);
    setInstallPrompt(null);
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
        className="text-fg hover:bg-bg-muted focus-visible:ring-primary-solid inline-flex min-h-11 w-full items-center justify-center gap-2 border border-border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
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
