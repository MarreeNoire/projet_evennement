import { env } from "@/lib/env";

import { CinetPayProvider } from "./cinetpay";
import { GeniusPayProvider } from "./geniuspay";
import { MockPaymentProvider } from "./mock";
import type { PaymentProvider, PaymentProviderName } from "./types";

/* =============================================================================
   Sélection du prestataire de paiement
   --------------------------------------------------------------------------
   Le reste de l'application ne connaît que l'interface `PaymentProvider` :
   changer d'agrégateur (PayDunya, Hub2, Flutterwave…) revient à ajouter une
   classe et une ligne ici.
   ========================================================================== */

const cachedProviders = new Map<PaymentProviderName, PaymentProvider>();

/** Retourne le prestataire actif ou celui d'une transaction existante. */
export function getPaymentProvider(
  name: PaymentProviderName = env.payment.provider,
): PaymentProvider {
  let provider = cachedProviders.get(name);
  if (!provider) {
    provider = createPaymentProvider(name);
    cachedProviders.set(name, provider);
  }
  return provider;
}

function createPaymentProvider(name: PaymentProviderName): PaymentProvider {
  switch (name) {
    case "cinetpay":
      return new CinetPayProvider();
    case "geniuspay":
      return new GeniusPayProvider();
    case "mock":
    default:
      return new MockPaymentProvider();
  }
}

export { CinetPayProvider, GeniusPayProvider, MockPaymentProvider };
export * from "./types";
export { buildCinetPayCustomerFields, normalizePhoneNumber, toAmount } from "./cinetpay-payload";
export {
  computeCinetPaySignature,
  extractOrderReference,
  isCinetPaySignatureValid,
} from "./cinetpay-signature";
