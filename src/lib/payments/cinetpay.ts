import { env } from "@/lib/env";

import {
  buildCinetPayCustomerFields,
  mapCheckResponse,
  type CinetPayCheckResponse,
  type CinetPayInitResponse,
} from "./cinetpay-payload";
import {
  computeCinetPaySignature,
  extractOrderReference,
  isCinetPaySignatureValid,
  type CinetPayRawFields,
} from "./cinetpay-signature";
import {
  PaymentError,
  normalizePaymentStatus,
  type CheckoutSession,
  type CreateCheckoutInput,
  type PaymentNotification,
  type PaymentProvider,
  type PaymentVerification,
} from "./types";

/* CinetPay : encaissement FCFA (Wave, Orange Money CI, MTN MoMo, Moov, cartes).
   Agrégateur licencié BCEAO. La notification HTTP ne sert que de DÉCLENCHEUR :
   la décision financière provient de la vérification serveur-à-serveur. */

const REQUEST_TIMEOUT_MS = 20_000;

interface CinetPayNotificationPayload extends Record<string, unknown>, CinetPayRawFields {
  cpm_result?: string;
  cpm_custom?: string;
  cel_phone_num?: string;
  payment_method?: string;
  signature?: string;
}

export class CinetPayProvider implements PaymentProvider {
  readonly name = "cinetpay" as const;

  private readonly apiKey = env.payment.cinetpay.apiKey;
  private readonly siteId = env.payment.cinetpay.siteId;
  private readonly secretKey = env.payment.cinetpay.secretKey;
  private readonly baseUrl = env.payment.cinetpay.baseUrl;
  private readonly channels = env.payment.cinetpay.channels;

  constructor() {
    if (!this.apiKey || !this.siteId || !this.secretKey) {
      throw new PaymentError(
        "NOT_CONFIGURED",
        "CinetPay n'est pas configuré : renseigne CINETPAY_API_KEY, CINETPAY_SITE_ID et " +
          "CINETPAY_SECRET_KEY, puis définis PAYMENT_PROVIDER=cinetpay.",
      );
    }
  }

  /** Ouvre une session de paiement et renvoie l'URL de redirection. */
  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession> {
    // CinetPay impose un identifiant court : on utilise la référence de
    // commande (« CMD-8F3K2P ») plutôt que l'UUID interne.
    const transactionId = input.orderReference;

    const response = await this.post<CinetPayInitResponse>("/v2/payment", {
      apikey: this.apiKey,
      site_id: this.siteId,
      transaction_id: transactionId,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      lang: "fr",
      channels: input.channels ?? this.channels,
      return_url: input.returnUrl,
      notify_url: input.notifyUrl,
      metadata: JSON.stringify({
        order_id: input.orderId,
        order_reference: input.orderReference,
        ...input.metadata,
      }),
      ...buildCinetPayCustomerFields(input.customer),
    });

    if (response.code !== "201" || !response.data?.payment_url) {
      throw new PaymentError(
        "CHECKOUT_FAILED",
        "Impossible d'ouvrir la page de paiement. Merci de réessayer.",
        response.message,
      );
    }

    return {
      provider: this.name,
      transactionId,
      paymentToken: response.data.payment_token ?? null,
      paymentUrl: response.data.payment_url,
    };
  }

  /** Vérification serveur-à-serveur : seule source de vérité du paiement. */
  async verify(transactionId: string): Promise<PaymentVerification> {
    const response = await this.post<CinetPayCheckResponse>("/v2/payment/check", {
      apikey: this.apiKey,
      site_id: this.siteId,
      transaction_id: transactionId,
    });

    return {
      provider: this.name,
      transactionId,
      ...mapCheckResponse(response),
      raw: response as unknown as Record<string, unknown>,
    };
  }

  /** Normalise et authentifie la notification reçue sur `notify_url`. */
  async parseNotification(
    payload: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<PaymentNotification> {
    const data = payload as CinetPayNotificationPayload;
    const transactionId = String(data.cpm_trans_id ?? "");

    if (!transactionId) {
      throw new PaymentError("INVALID_NOTIFICATION", "Notification CinetPay sans transaction_id.");
    }

    const providedSignature = data.signature ?? headers?.["x-token"] ?? headers?.["X-Token"];

    return {
      provider: this.name,
      transactionId,
      orderReference: extractOrderReference(data.cpm_custom),
      // Chez CinetPay, cpm_result = « 00 » en cas de succès.
      status: normalizePaymentStatus(data.cpm_result),
      amount: data.cpm_amount == null ? null : Math.round(Number(data.cpm_amount)),
      currency: data.cpm_currency ?? null,
      method: data.payment_method ?? null,
      payerPhone: data.cel_phone_num ? String(data.cel_phone_num) : null,
      signatureValid: isCinetPaySignatureValid(data, providedSignature, this.secretKey),
      raw: {
        ...payload,
        expected_signature: computeCinetPaySignature(data, this.secretKey),
      },
    };
  }

  private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: "no-store",
      });
    } catch (error) {
      throw new PaymentError(
        "NETWORK_ERROR",
        "Le service de paiement est momentanément injoignable. Merci de réessayer.",
        error instanceof Error ? error.message : undefined,
      );
    }

    if (!response.ok) {
      throw new PaymentError(
        "PROVIDER_ERROR",
        "Le service de paiement a renvoyé une erreur.",
        `HTTP ${response.status}`,
      );
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new PaymentError("INVALID_RESPONSE", "Réponse illisible du service de paiement.");
    }
  }
}