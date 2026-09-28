import { env } from "@/lib/env";
import type { PaymentStatus } from "@/types/database";

import {
  PaymentError,
  type CheckoutSession,
  type CreateCheckoutInput,
  type PaymentNotification,
  type PaymentProvider,
  type PaymentVerification,
} from "./types";

/* =============================================================================
   Prestataire « mock » — développement et démonstration
   --------------------------------------------------------------------------
   Permet de dérouler le parcours d'achat complet (commande, redirection,
   confirmation, génération des billets, email) SANS compte marchand.
   Le mode est piloté par PAYMENT_PROVIDER=mock (valeur par défaut).

   ⚠️  Refuse de fonctionner en production : impossible d'encaisser réellement.
   ========================================================================== */

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock" as const;

  constructor() {
    if (env.isProduction) {
      throw new PaymentError(
        "PROVIDER_DISABLED",
        "Le prestataire de test est désactivé en production. " +
          "Passe PAYMENT_PROVIDER à un prestataire configuré et renseigne ses clés.",
      );
    }
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession> {
    const transactionId = `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const url = new URL(`/paiement/simulation/${input.orderId}`, env.appUrl);
    url.searchParams.set("tx", transactionId);
    url.searchParams.set("montant", String(input.amount));

    return {
      provider: this.name,
      transactionId,
      paymentToken: `tok_${transactionId}`,
      paymentUrl: url.toString(),
    };
  }

  async verify(transactionId: string): Promise<PaymentVerification> {
    return {
      provider: this.name,
      transactionId,
      status: "pending" as PaymentStatus,
      amount: null,
      currency: env.currency,
      method: "simulation",
      raw: { simulated: true, transactionId },
    };
  }

  /**
   * En mode simulation, la décision (accepter / refuser) est transmise par la
   * page de simulation elle-même. Aucune signature n'est vérifiable ici.
   */
  async parseNotification(payload: Record<string, unknown>): Promise<PaymentNotification> {
    const transactionId = String(payload.transaction_id ?? "");
    const decision = String(payload.decision ?? "accepted").toLowerCase();

    if (!transactionId) {
      throw new PaymentError("INVALID_NOTIFICATION", "Notification de test incomplète.");
    }

    const status: PaymentStatus =
      decision === "accepted" ? "accepted" : decision === "cancelled" ? "cancelled" : "refused";

    return {
      provider: this.name,
      transactionId,
      orderReference: payload.order_reference ? String(payload.order_reference) : null,
      status,
      amount: payload.amount != null ? Number(payload.amount) : null,
      currency: payload.currency ? String(payload.currency) : env.currency,
      method: "simulation",
      payerPhone: payload.payer_phone ? String(payload.payer_phone) : null,
      signatureValid: true,
      raw: payload,
    };
  }
}
