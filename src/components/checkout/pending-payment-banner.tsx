"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock3, X } from "lucide-react";

import {
  clearPendingPayment,
  readPendingPayment,
  type PendingPayment,
} from "@/lib/orders/pending-payment";

import styles from "./checkout-form.module.css";

/* Rappelle à l'utilisateur qu'un paiement a été lancé pour cet événement et lui
   donne le chemin direct vers son statut. Indispensable en PWA : après le
   passage chez le prestataire, l'écran de commande est resté ouvert tel quel. */

export function PendingPaymentBanner({ eventId }: { eventId: string }) {
  const [pending, setPending] = useState<PendingPayment | null>(null);

  useEffect(() => {
    const sync = () => setPending(readPendingPayment(eventId));
    sync();

    // Au retour dans l'application (PWA ramenée au premier plan), on relit.
    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", sync);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", sync);
    };
  }, [eventId]);

  if (!pending) return null;

  return (
    <div className={styles.pending} role="status">
      <span className={styles.pendingIcon} aria-hidden="true">
        <Clock3 />
      </span>
      <div className={styles.pendingText}>
        <p className={styles.pendingTitle}>Un paiement est peut-être en cours</p>
        <p className={styles.pendingBody}>
          {pending.reference ? `Commande ${pending.reference}. ` : ""}Vérifie son statut avant d’en
          lancer un nouveau, pour ne pas payer deux fois.
        </p>
        <Link href={`/commandes/${pending.orderId}/retour`} className={styles.pendingLink}>
          Voir le statut de ma commande
        </Link>
      </div>
      <button
        type="button"
        className={styles.pendingDismiss}
        aria-label="Masquer ce rappel"
        onClick={() => {
          clearPendingPayment();
          setPending(null);
        }}
      >
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
