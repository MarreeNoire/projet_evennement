"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const MAX_POLLING_MS = 5 * 60 * 1000;
const FAST_POLLING_MS = 15 * 1000;
const SLOW_POLLING_MS = 30 * 1000;
const FAST_POLLING_WINDOW_MS = 60 * 1000;

/** Rafraîchit la page de retour pour relire le statut réel côté serveur. */
export function PaymentStatusPoller({ active }: { active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;

    const startedAt = Date.now();
    let timeoutId: number | undefined;
    let stopped = false;

    const scheduleNextCheck = () => {
      if (stopped) return;

      const elapsed = Date.now() - startedAt;
      if (elapsed >= MAX_POLLING_MS) return;

      const delay = elapsed < FAST_POLLING_WINDOW_MS ? FAST_POLLING_MS : SLOW_POLLING_MS;
      timeoutId = window.setTimeout(() => {
        if (Date.now() - startedAt < MAX_POLLING_MS && document.visibilityState === "visible") {
          router.refresh();
        }
        scheduleNextCheck();
      }, Math.min(delay, MAX_POLLING_MS - elapsed));
    };

    scheduleNextCheck();

    return () => {
      stopped = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [active, router]);

  return null;
}
