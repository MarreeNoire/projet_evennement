"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, X, Smartphone, Monitor } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/components/providers/app-providers";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const { resolvedTheme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const isDark = resolvedTheme === 'dark';
  const bgColor = isDark ? 'bg-void-900' : 'bg-surface';
  const borderColor = isDark ? 'border-white/10' : 'border-border';

  useEffect(() => {
    // Détecter si déjà en mode standalone (installé)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    // Vérifier si déjà rejeté récemment (stockage local 30 jours)
    const dismissedUntil = localStorage.getItem('pwa-install-dismissed-until');
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Afficher après un délai pour ne pas agresser l'utilisateur
      setTimeout(() => setShowPrompt(true), 5000);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
      toast.success("Event installé !", {
        description: "Tu peux maintenant y accéder depuis ton écran d'accueil."
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success("Installation lancée !");
      } else {
        toast.info("Installation annulée");
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (err) {
      console.error('[PWA] Erreur installation:', err);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setDismissed(true);
    // Ne pas re-afficher pendant 30 jours
    localStorage.setItem('pwa-install-dismissed-until', String(Date.now() + 30 * 24 * 60 * 60 * 1000));
  }, []);

  const handleDismissSession = useCallback(() => {
    setShowPrompt(false);
    // Juste pour cette session
  }, []);

  // Ne pas afficher si déjà installé, pas de prompt, ou déjà rejeté cette session
  if (isStandalone || !deferredPrompt || !showPrompt || dismissed) {
    return null;
  }

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div 
      className={`fixed bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-80 z-50 animate-slide-up ${isMobile ? 'md:hidden' : 'hidden md:block'}`}
      role="dialog"
      aria-label="Installer l'application Event"
    >
      <div className={`${bgColor} border ${borderColor} rounded-2xl shadow-2xl p-4 flex items-center gap-3`}>
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
          isDark ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'
        }`}>
          {isMobile ? <Smartphone className="size-5" /> : <Monitor className="size-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Installer Event</p>
          <p className="text-xs text-fg-muted mt-0.5">
            {isMobile 
              ? "Ajoute à l'écran d'accueil pour un accès rapide" 
              : "Installe l'app pour un accès hors-ligne et notifications"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-fg hover:bg-primary/90 transition-colors"
          >
            <Download className="size-3.5" />
            Installer
          </button>
          <button
            onClick={handleDismissSession}
            className="p-1.5 rounded-lg text-fg-muted hover:bg-muted transition-colors"
            aria-label="Plus tard"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Version mobile : banner en bas d'écran plus discrète
export function PWAInstallBanner() {
  const { resolvedTheme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const isDark = resolvedTheme === 'dark';
  const bgColor = isDark ? 'bg-void-900' : 'bg-surface';
  const borderColor = isDark ? 'border-white/10' : 'border-border';

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    const dismissedUntil = localStorage.getItem('pwa-install-dismissed-until');
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 8000); // Plus tard sur mobile
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowBanner(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowBanner(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed-until', String(Date.now() + 30 * 24 * 60 * 60 * 1000));
  }, []);

  if (isStandalone || !deferredPrompt || !showBanner || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-40 animate-slide-up" role="dialog">
      <div className={`${bgColor} border-t ${borderColor} rounded-t-2xl shadow-2xl p-3 pb-safe flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${isDark ? 'bg-primary/20' : 'bg-primary/10'}`}>
            <Download className={`size-5 ${isDark ? 'text-primary' : 'text-primary'}`} />
          </div>
          <div>
            <p className="font-medium text-sm">Installer Event</p>
            <p className="text-xs text-fg-muted">Accès rapide + hors-ligne + notifications</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-fg"
          >
            Installer
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-fg-muted"
            aria-label="Fermer"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}