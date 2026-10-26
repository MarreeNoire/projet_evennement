"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowDownToLine, X } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function subscribeToDisplayMode(onChange: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function isStandaloneDisplay() {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone === true;
}

function subscribeToPointer(onChange: () => void) {
  const media = window.matchMedia("(pointer: coarse)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function hasCoarsePointer() {
  return window.matchMedia("(pointer: coarse)").matches;
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [installedFromEvent, setInstalledFromEvent] = useState(false);
  const isInstalled = useSyncExternalStore(subscribeToDisplayMode, isStandaloneDisplay, () => false) || installedFromEvent;
  const isTouchDevice = useSyncExternalStore(subscribeToPointer, hasCoarsePointer, () => false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

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

  if (isInstalled || dismissed || (!installEvent && !isTouchDevice)) return null;

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
    <aside className="pwa-install-card" aria-label="Installer l’application Event">
      <span className="pwa-install-icon" aria-hidden="true">
        <ArrowDownToLine className="size-5" />
      </span>
      <div className="pwa-install-copy">
        <strong>Event, toujours à portée de main</strong>
        <span>Ajoute l’application à ton écran d’accueil.</span>
        {showInstructions ? (
          <span className="pwa-install-instructions">
            Dans le menu de ton navigateur, choisis « Installer » ou « Ajouter à l’écran d’accueil ».
          </span>
        ) : null}
      </div>
      <button type="button" className="pwa-install-button" onClick={() => void install()}>
        {installEvent ? "Installer" : showInstructions ? "Masquer" : "Comment faire"}
      </button>
      <button
        type="button"
        className="pwa-install-dismiss"
        aria-label="Masquer le conseil d’installation"
        onClick={() => setDismissed(true)}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </aside>
  );
}
