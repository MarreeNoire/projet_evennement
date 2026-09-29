"use client";

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from "react";

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

interface PwaInstallContextValue {
  canInstall: boolean;
  installed: boolean;
  promptInstall: () => Promise<boolean>;
}

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

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

export function PwaInstallProvider({ children }: { children: React.ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [didInstall, setDidInstall] = useState(false);
  const isStandalone = useSyncExternalStore(
    subscribeToInstallState,
    getInstallState,
    getServerInstallState,
  );

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setDidInstall(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === "accepted") setDidInstall(true);
    return choice.outcome === "accepted";
  }, [installPrompt]);

  return (
    <PwaInstallContext.Provider
      value={{ canInstall: Boolean(installPrompt), installed: isStandalone || didInstall, promptInstall }}
    >
      {children}
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstall() {
  const context = useContext(PwaInstallContext);
  if (!context) throw new Error("usePwaInstall doit être utilisé dans PwaInstallProvider.");
  return context;
}
