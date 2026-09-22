import { env } from "@/lib/env";

import { CinetPayProvider } from "./cinetpay";
import { MockPaymentProvider } from "./mock";
import type { PaymentProvider, PaymentProviderName } from "./types";

/* =============================================================================
   Sélection du prestataire de paiement
   --------------------------------------------------------------------------
   Le reste de l'application ne connaît que l'interface `PaymentProvider` :
   changer d'agrégateur (PayDunya, Hub2, Flutterwave…) revient à ajouter une
   classe et une ligne ici.
   ========================================================================== */

let cachedProvider: PaymentProvider | null = null;

/** Retourne l'instance du prestataire actif (mise en cache). */
export function getPaymentProvider(): PaymentProvider {
  cachedProvider ??= createPaymentProvider(env.payment.provider);
  return cachedProvider;
}

function createPaymentProvider(name: PaymentProviderName): PaymentProvider {
  switch (name) {
    case "cinetpay":
      return new CinetPayProvider();
    case "mock":
    default:
      return new MockPaymentProvider();
  }
}

export { CinetPayProvider, MockPaymentProvider };
export * from "./types";
export { buildCinetPayCustomerFields, normalizePhoneNumber, toAmount } from "./cinetpay-payload";
export {
  computeCinetPaySignature,
  extractOrderReference,
  isCinetPaySignatureValid,
} from "./cinetpay-signature";