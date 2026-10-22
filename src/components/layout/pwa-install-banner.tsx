"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Download, Plus, X } from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import { haptic } from "@/lib/ui/haptics";
import { usePwaInstall } from "@/components/providers/pwa-install-provider";

/* =============================================================================
   Bannière d'installation PWA
   --------------------------------------------------------------------------
   - Chromium (beforeinstallprompt) : bouton « Installer » natif.
   - iOS Safari (pas d'événement disponible) : instructions « Partager →
     Ajouter à l'écran d'accueil », correspond à l'usage Safari.
   - Fermeture persistée (localStorage, synchronisée via useSyncExternalStore :
     aucun setState dans un effet). Jamais affichée si l'app est déjà
     installée.
   ========================================================================== */

const DISMISS_KEY = "event_install_dismissed";

function subscribeVisibility(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return true; /* Sans accès au stockage, on n'affiche pas la bannière. */
  }
}

function getIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua) && /Safari/i.test(ua);
}

function subscribeNoop() {
  return () => undefined;
}

export function PwaInstallBanner() {
  const { canInstall, installed, promptInstall } = usePwaInstall();
  const dismissed = useSyncExternalStore(subscribeVisibility, getDismissed, () => true);
  const isIos = useSyncExternalStore(subscribeNoop, getIosSafari, () => false);

  if (dismissed || installed) return null;
  if (!canInstall && !isIos) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignorer.
    }
    // useSyncExternalStore redéclenche via l'événement storage sinon :
    window.dispatchEvent(new Event("storage"));
  };

  const install = async () => {
    haptic("success");
    const accepted = await promptInstall();
    if (accepted) dismiss();
  };

  return (
    <aside
      role="complementary"
      aria-label="Installer l'application"
      className="border-border bg-surface fixed inset-x-4 bottom-22 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border p-3 shadow-[0_8px_30px_rgba(10,8,18,0.35)] md:inset-x-auto md:bottom-6 md:right-6"
    >
      {canInstall ? (
        <>
          <span className="bg-primary-solid text-primary-solid-fg flex size-11 shrink-0 items-center justify-center rounded-xl">
            <Download className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-fg text-sm font-bold">Installer {APP_NAME}</p>
            <p className="text-fg-subtle text-xs leading-snug">
              Accès direct, hors ligne, plein écran.
            </p>
          </div>
          <button
            type="button"
            onClick={install}
            className="press bg-primary-solid text-primary-solid-fg inline-flex h-11 shrink-0 items-center rounded-xl px-3.5 text-sm font-bold"
          >
            Installer
          </button>
        </>
      ) : (
        <>
          <span className="text-primary bg-primary-subtle flex size-11 shrink-0 items-center justify-center rounded-xl">
            <Plus className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-fg text-sm font-bold">Installer {APP_NAME} sur ton iPhone</p>
            <p className="text-fg-subtle text-xs leading-snug">
              Dans Safari : <span className="text-fg font-semibold">Partager</span>, puis{" "}
              <span className="text-fg font-semibold">Ajouter à l&apos;écran d&apos;accueil</span>.
            </p>
          </div>
          <Link
            href="/aide"
            aria-label="Aide à l'installation"
            className="text-fg-muted hover:bg-bg-muted press inline-flex size-11 shrink-0 items-center justify-center rounded-xl"
          >
            ?
          </Link>
        </>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Ne plus afficher la bannière d'installation"
        className="text-fg-subtle hover:bg-bg-muted press absolute -top-2.5 -right-2.5 inline-flex size-8 items-center justify-center rounded-full border border-border bg-bg"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </aside>
  );
}
