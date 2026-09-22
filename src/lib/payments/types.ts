import type { PaymentStatus } from "@/types/database";

/* =============================================================================
   Abstraction du prestataire de paiement
   --------------------------------------------------------------------------
   Toute la logique métier (commandes, billets, webhooks) ne dépend QUE de ces
   interfaces. Changer d'agrégateur (CinetPay -> Hub2, PayDunya, Flutterwave…)
   revient à ajouter une implémentation, sans toucher au reste de l'application.
   ========================================================================== */

export type PaymentProviderName = "mock" | "cinetpay";

/** Informations client transmises au prestataire. */
export interface CheckoutCustomer {
  name?: string;
  surname?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  state?: string;
  zipCode?: string;
}

/** Demande d'ouverture d'un paiement. */
export interface CreateCheckoutInput {
  /** Identifiant de commande interne (sert de `transaction_id` chez le PSP). */
  orderId: string;
  /** Référence lisible affichée au client (ex. « CMD-8F3K2P »). */
  orderReference: string;
  /** Montant en FCFA entiers (le franc CFA n'a pas de décimales). */
  amount: number;
  currency: string;
  description: string;
  customer: CheckoutCustomer;
  /** Canaux imposés, ex. « ALL », « MOBILE_MONEY », « CREDIT_CARD ». */
  channels?: string;
  /** Métadonnées renvoyées telles quelles par le prestataire. */
  metadata?: Record<string, string>;
  /** URL de retour de l'utilisateur après paiement. */
  returnUrl: string;
  /** URL de notification serveur à notification (webhook). */
  notifyUrl: string;
}

/** Résultat de l'ouverture d'un paiement. */
export interface CheckoutSession {
  provider: PaymentProviderName;
  /** Identifiant de transaction chez le prestataire. */
  transactionId: string;
  /** Jeton de paiement, si le prestataire en fournit un. */
  paymentToken: string | null;
  /** URL vers laquelle rediriger l'utilisateur. */
  paymentUrl: string;
}

/** Résultat d'une vérification serveur d'une transaction. */
export interface PaymentVerification {
  provider: PaymentProviderName;
  transactionId: string;
  status: PaymentStatus;
  amount: number | null;
  currency: string | null;
  method: string | null;
  /** Charge utile brute, conservée pour audit. */
  raw: Record<string, unknown>;
}

/** Notification (webhook) reçue du prestataire, déjà normalisée. */
export interface PaymentNotification {
  provider: PaymentProviderName;
  transactionId: string;
  /** Référence de commande interne, si le prestataire la renvoie. */
  orderReference: string | null;
  status: PaymentStatus;
  amount: number | null;
  currency: string | null;
  method: string | null;
  payerPhone: string | null;
  /** `true` si la signature HMAC a été vérifiée avec succès. */
  signatureValid: boolean;
  raw: Record<string, unknown>;
}

/** Contrat que doit respecter chaque prestataire. */
export interface PaymentProvider {
  readonly name: PaymentProviderName;

  /** Ouvre un paiement et renvoie l'URL de redirection. */
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession>;

  /** Interroge le prestataire pour connaître l'état réel d'une transaction. */
  verify(transactionId: string): Promise<PaymentVerification>;

  /**
   * Normalise et authentifie une notification reçue sur `notifyUrl`.
   * Ne doit JAMAIS faire confiance à la charge utile sans vérifier la signature.
   */
  parseNotification(
    payload: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<PaymentNotification>;
}

/** Erreur métier de paiement, avec un message destiné à l'utilisateur. */
export class PaymentError extends Error {
  readonly code: string;
  readonly providerMessage?: string;

  constructor(code: string, message: string, providerMessage?: string) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.providerMessage = providerMessage;
  }
}

/** Normalise les statuts renvoyés par les prestataires. */
export function normalizePaymentStatus(rawStatus: unknown): PaymentStatus {
  const value = String(rawStatus ?? "").trim().toUpperCase();

  switch (value) {
    case "ACCEPTED":
    case "SUCCESS":
    case "SUCCESSFUL":
    case "PAID":
    case "COMPLETED":
      return "accepted";
    case "PENDING":
    case "PROCESSING":
    case "INITIATED":
      return "pending";
    case "REFUSED":
    case "DECLINED":
    case "FAILED":
    case "ERROR":
      return "refused";
    case "CANCELLED":
    case "CANCELED":
      return "cancelled";
    case "REFUNDED":
      return "refunded";
    default:
      return "error";
  }
}

/** Un statut « accepté » signifie-t-il que la commande est payée ? */
export function isPaidStatus(status: PaymentStatus): boolean {
  return status === "accepted";
}