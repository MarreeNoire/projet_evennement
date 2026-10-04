import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";

import {
  PaymentError,
  normalizePaymentStatus,
  type CheckoutSession,
  type CreateCheckoutInput,
  type PaymentNotification,
  type PaymentProvider,
  type PaymentVerification,
} from "./types";

const REQUEST_TIMEOUT_MS = 20_000;

interface GeniusPayTransaction extends Record<string, unknown> {
  reference?: string | number;
  status?: string;
  amount?: number | string;
  currency?: string;
  payment_method?: string;
  provider?: string;
  metadata?: Record<string, unknown>;
  checkout_url?: string;
  payment_url?: string;
}

interface GeniusPayResponse extends Record<string, unknown> {
  success?: boolean;
  message?: string;
  data?: GeniusPayTransaction;
  error?: { message?: string };
}

export class GeniusPayProvider implements PaymentProvider {
  readonly name = "geniuspay" as const;

  private readonly apiKey = env.payment.geniuspay.apiKey;
  private readonly apiSecret = env.payment.geniuspay.apiSecret;
  private readonly webhookSecret = env.payment.geniuspay.webhookSecret;
  private readonly baseUrl = env.payment.geniuspay.baseUrl;

  constructor() {
    if (!this.apiKey || !this.apiSecret || !this.webhookSecret) {
      throw new PaymentError(
        "NOT_CONFIGURED",
        "GeniusPay n'est pas configuré : renseigne GENIUSPAY_API_KEY, " +
          "GENIUSPAY_API_SECRET et GENIUSPAY_WEBHOOK_SECRET, puis définis PAYMENT_PROVIDER=geniuspay.",
      );
    }
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession> {
    // Nettoyer la description : supprimer les caractères Unicode spéciaux (ex: ·) qui font rejeter la requête par GeniusPay.
    const cleanDescription = input.description
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s-_.,]/g, " ")
      .trim()
      .slice(0, 200) || "Paiement en ligne";

    // Sécuriser les informations client (GeniusPay exige au minimum un nom)
    const customerName = (input.customer.name?.trim() || "Client").slice(0, 100);
    const customerEmail = input.customer.email?.trim() || undefined;
    const customerPhone = input.customer.phone?.trim() || undefined;
    const customerCountry = input.customer.country?.trim() || "CI";

    const reference = (input.orderReference || input.orderId).replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 50);

    const payload = {
      amount: Math.round(input.amount),
      currency: (input.currency || "XOF").toUpperCase(),
      description: cleanDescription,
      reference,
      order_id: input.orderId,
      success_url: input.returnUrl,
      error_url: input.returnUrl,
      cancel_url: input.returnUrl,
      callback_url: input.notifyUrl,
      webhook_url: input.notifyUrl,
      customer: {
        name: customerName,
        ...(customerEmail ? { email: customerEmail } : {}),
        ...(customerPhone ? { phone: customerPhone } : {}),
        country: customerCountry,
      },
      metadata: {
        ...input.metadata,
        order_id: input.orderId,
        order_reference: input.orderReference,
      },
    };

    const response = await this.request<GeniusPayResponse>("/payments", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const transaction = response.data;
    const transactionId = transaction?.reference == null ? reference : String(transaction.reference);
    const paymentUrl =
      transaction?.checkout_url ??
      transaction?.payment_url ??
      (typeof response.checkout_url === "string" ? response.checkout_url : undefined) ??
      (typeof response.payment_url === "string" ? response.payment_url : undefined);

    if (!response.success && !paymentUrl) {
      console.error("[GeniusPay] API error response:", response);
      throw new PaymentError(
        "CHECKOUT_FAILED",
        "Impossible d'ouvrir la page de paiement GeniusPay. Merci de réessayer.",
        response.error?.message ?? response.message,
      );
    }

    if (!paymentUrl) {
      console.error("[GeniusPay] Missing checkout URL in response:", response);
      throw new PaymentError(
        "CHECKOUT_FAILED",
        "GeniusPay n'a pas renvoyé d'URL de redirection de paiement.",
      );
    }

    let checkoutUrl: URL;
    try {
      checkoutUrl = new URL(paymentUrl);
    } catch {
      throw new PaymentError(
        "INVALID_RESPONSE",
        "GeniusPay a renvoyé une URL de paiement invalide.",
      );
    }

    return {
      provider: this.name,
      transactionId,
      paymentToken: null,
      paymentUrl: checkoutUrl.toString(),
    };
  }

  async verify(transactionId: string): Promise<PaymentVerification> {
    const response = await this.request<GeniusPayResponse>(
      `/payments/${encodeURIComponent(transactionId)}`,
    );
    const transaction = response.data;
    if (!response.success || !transaction) {
      throw new PaymentError(
        "VERIFICATION_FAILED",
        "Impossible de vérifier le paiement auprès de GeniusPay.",
        response.error?.message ?? response.message,
      );
    }

    return {
      provider: this.name,
      transactionId: String(transaction.reference ?? transactionId),
      status: normalizePaymentStatus(transaction.status),
      amount: toAmount(transaction.amount),
      currency: typeof transaction.currency === "string" ? transaction.currency : null,
      method:
        typeof transaction.payment_method === "string"
          ? transaction.payment_method
          : typeof transaction.provider === "string"
            ? transaction.provider
            : null,
      raw: response,
    };
  }

  async parseNotification(
    payload: Record<string, unknown>,
    headers: Record<string, string> = {},
    rawBody = JSON.stringify(payload),
  ): Promise<PaymentNotification> {
    const data = asRecord(payload.data);
    const metadata = asRecord(data.metadata);
    const transactionId = data.reference == null ? "" : String(data.reference);
    if (!transactionId) {
      throw new PaymentError(
        "INVALID_NOTIFICATION",
        "Notification GeniusPay sans référence de transaction.",
      );
    }

    const signature = headers["x-webhook-signature"] ?? "";
    const timestamp = headers["x-webhook-timestamp"] ?? "";
    const signatureValid = this.isValidWebhookSignature(rawBody, timestamp, signature);
    const event = typeof payload.event === "string" ? payload.event : "";
    const status = data.status ?? statusFromEvent(event);

    return {
      provider: this.name,
      transactionId,
      orderReference:
        typeof metadata.order_reference === "string" ? metadata.order_reference : null,
      status: normalizePaymentStatus(status),
      amount: toAmount(data.amount),
      currency: typeof data.currency === "string" ? data.currency : null,
      method:
        typeof data.payment_method === "string"
          ? data.payment_method
          : typeof data.provider === "string"
            ? data.provider
            : null,
      payerPhone: typeof data.customer_phone === "string" ? data.customer_phone : null,
      signatureValid,
      raw: payload,
    };
  }

  private isValidWebhookSignature(rawBody: string, timestamp: string, signature: string): boolean {
    if (!timestamp || !signature || !this.webhookSecret) return false;

    const timestampSeconds = Number(timestamp);
    if (
      !Number.isFinite(timestampSeconds) ||
      Math.abs(Date.now() / 1000 - timestampSeconds) > 300
    ) {
      return false;
    }

    const expected = createHmac("sha256", this.webhookSecret)
      .update(`${timestamp}.${rawBody}`, "utf8")
      .digest();
    const providedHex = signature.trim().replace(/^sha256=/i, "");
    if (!/^[a-f\d]{64}$/i.test(providedHex)) return false;

    try {
      return timingSafeEqual(expected, Buffer.from(providedHex, "hex"));
    } catch {
      return false;
    }
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
          "X-API-Secret": this.apiSecret,
          ...init.headers,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: "no-store",
      });
    } catch (error) {
      throw new PaymentError(
        "NETWORK_ERROR",
        "GeniusPay est momentanément injoignable. Merci de réessayer.",
        error instanceof Error ? error.message : undefined,
      );
    }

    let body: T;
    try {
      body = (await response.json()) as T;
    } catch {
      throw new PaymentError("INVALID_RESPONSE", "Réponse illisible du service GeniusPay.");
    }

    if (!response.ok) {
      const errorBody = body as { error?: { message?: string }; message?: string };
      throw new PaymentError(
        "PROVIDER_ERROR",
        "GeniusPay a refusé la requête de paiement.",
        errorBody.error?.message ?? errorBody.message ?? `HTTP ${response.status}`,
      );
    }

    return body;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount) : null;
}

function statusFromEvent(event: string): string {
  switch (event) {
    case "payment.success":
      return "completed";
    case "payment.failed":
      return "failed";
    case "payment.cancelled":
    case "payment.expired":
      return "cancelled";
    case "payment.refunded":
      return "refunded";
    default:
      return "pending";
  }
}
