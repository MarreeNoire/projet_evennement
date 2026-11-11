"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowDownToLine, Check } from "lucide-react";

import {
  isStandaloneDisplay,
  serverStandaloneSnapshot,
  subscribeToStandalone,
} from "@/lib/pwa/standalone";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [installedFromEvent, setInstalledFromEvent] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const isInstalled =
    useSyncExternalStore(subscribeToStandalone, isStandaloneDisplay, serverStandaloneSnapshot) ||
    installedFromEvent;

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalledFromEvent(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!installEvent) {
      setShowInstructions((value) => !value);
      return;
    }

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") setInstalledFromEvent(true);
    } catch {
      setShowInstructions(true);
    } finally {
      setInstallEvent(null);
    }
  }

  return (
    <div className="pwa-install-control">
      {isInstalled ? (
        <span className="pwa-install-status" aria-label="Event est installée">
          <Check aria-hidden="true" />
          <span>Installée</span>
        </span>
      ) : (
        <>
          <button
            type="button"
            className="pwa-install-control-button"
            onClick={() => void install()}
            aria-expanded={showInstructions}
            aria-controls="pwa-install-instructions"
          >
            <ArrowDownToLine aria-hidden="true" />
            <span>Télécharger</span>
          </button>
          {showInstructions ? (
            <p className="pwa-install-instructions" id="pwa-install-instructions" role="status">
              {installEvent
                ? "L’installation va s’ouvrir. Suis les instructions de ton navigateur."
                : "Dans le menu de ton navigateur, choisis « Installer Event » ou « Ajouter à l’écran d’accueil »."}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
