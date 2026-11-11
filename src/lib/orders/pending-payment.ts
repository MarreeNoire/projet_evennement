/* =============================================================================
   Paiement en attente — mémoire côté appareil
   --------------------------------------------------------------------------
   Le paiement mobile money se termine sur la page du prestataire, hors de
   l'application. Dans une PWA, l'utilisateur revient souvent « par la porte de
   derrière » : l'écran de commande est resté tel quel et rien ne lui dit que
   sa commande existe déjà. On garde donc, le temps qu'il faut, l'identifiant de
   la commande lancée pour lui proposer de reprendre là où il en était.

   Stocké en localStorage (survit au passage par une autre fenêtre), expire seul,
   ne contient aucune donnée personnelle ni de paiement.
   ========================================================================== */

const KEY = "event_pending_payment";
const TTL_MS = 45 * 60 * 1000;

export type PendingPayment = {
  orderId: string;
  reference: string;
  eventId: string;
  at: number;
};

export function savePendingPayment(payment: PendingPayment): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(payment));
  } catch {
    // Stockage bloqué : le tunnel reste utilisable, on perd juste la reprise.
  }
}

export function readPendingPayment(eventId?: string): PendingPayment | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PendingPayment>;
    if (
      typeof parsed.orderId !== "string" ||
      typeof parsed.eventId !== "string" ||
      typeof parsed.at !== "number"
    ) {
      window.localStorage.removeItem(KEY);
      return null;
    }

    if (Date.now() - parsed.at > TTL_MS) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    if (eventId && parsed.eventId !== eventId) return null;

    return {
      orderId: parsed.orderId,
      reference: typeof parsed.reference === "string" ? parsed.reference : "",
      eventId: parsed.eventId,
      at: parsed.at,
    };
  } catch {
    return null;
  }
}

export function clearPendingPayment(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Rien à faire.
  }
}
