"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowDownToLine } from "lucide-react";

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [installedFromEvent, setInstalledFromEvent] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructions, setInstructions] = useState("");
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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (showInstructions && !dialog.open) dialog.showModal();
    if (!showInstructions && dialog.open) dialog.close();
  }, [showInstructions]);

  async function install() {
    if (!installEvent) {
      const agent = navigator.userAgent;
      const isIos = /iPhone|iPad|iPod/i.test(agent);
      const isAndroid = /Android/i.test(agent);
      const isSafari = /Safari/i.test(agent) && !/Chrome|Chromium|CriOS|Edg/i.test(agent);

      setInstructions(
        isIos
          ? "Dans Safari, touche Partager, puis « Ajouter à l’écran d’accueil ». Event sera installée comme une application PWA et s’ouvrira sans la barre de Safari."
          : isAndroid
            ? "Chrome n’a pas encore fourni sa confirmation d’installation PWA pour cet appareil. Quand la PWA est reconnue comme installable, ce bouton ouvre directement sa confirmation. Pour une vraie application Android, utilise Chrome avec Google Play Services ou Samsung Internet ; « Créer un raccourci » ne l’installe pas."
            : isSafari
              ? "Dans Safari, ouvre le menu Fichier puis choisis « Ajouter au Dock »."
              : "Ce navigateur n’a pas encore proposé l’installation PWA d’Event. Ouvre Event dans Chrome ou Edge et utilise leur option « Installer Event » lorsqu’elle est disponible. N’utilise pas « Créer un raccourci », qui ne crée pas une application installée.",
      );
      setShowInstructions(true);
      return;
    }

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") setInstalledFromEvent(true);
    } catch {
      setInstructions("L’installation n’a pas pu s’ouvrir. Réessaie depuis le menu d’installation de ton navigateur.");
      setShowInstructions(true);
    } finally {
      setInstallEvent(null);
    }
  }

  if (isInstalled) return null;

  return (
    <div className="pwa-install-control">
      <button
        type="button"
        className="pwa-install-control-button"
        onClick={() => void install()}
        aria-expanded={showInstructions}
        aria-controls="pwa-install-dialog"
        aria-haspopup="dialog"
      >
        <ArrowDownToLine aria-hidden="true" />
        <span>Installer l’application</span>
      </button>
      <dialog
        id="pwa-install-dialog"
        ref={dialogRef}
        className="pwa-install-dialog"
        aria-labelledby="pwa-install-title"
        onCancel={(event) => {
          event.preventDefault();
          setShowInstructions(false);
        }}
        onClose={() => setShowInstructions(false)}
      >
        <div className="pwa-install-dialog-content">
          <div className="pwa-install-dialog-icon" aria-hidden="true">
            <ArrowDownToLine />
          </div>
          <p className="pwa-install-dialog-eyebrow">Event, partout avec toi</p>
          <h2 id="pwa-install-title">Installe l’application</h2>
          <p className="pwa-install-dialog-copy">
            Accède plus vite à tes événements et à tes salons depuis ton écran d’accueil.
          </p>
          <p className="pwa-install-dialog-help">{instructions}</p>
          <button
            type="button"
            className="pwa-install-dialog-close"
            onClick={() => setShowInstructions(false)}
          >
            Compris
          </button>
        </div>
      </dialog>
    </div>
  );
}
