"use client";

import { useEffect } from "react";

import { clearPendingPayment } from "@/lib/orders/pending-payment";

/** Nettoie la tentative de commande et le rappel de paiement une fois la commande réglée. */
export function ClearCheckoutAttempt({ eventId }: { eventId: string }) {
  useEffect(() => {
    try {
      window.sessionStorage.removeItem(`rassemble_checkout_${eventId}`);
    } catch {
      // Stockage indisponible : rien à nettoyer.
    }
    clearPendingPayment();
  }, [eventId]);

  return null;
}
