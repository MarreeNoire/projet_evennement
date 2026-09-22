import type { PaymentStatus } from "@/types/database";

import { normalizePaymentStatus, type CheckoutCustomer } from "./types";

/**
 * Construit les champs client attendus par CinetPay.
 * CinetPay exige le nom et le prénom séparés, et n'accepte pas les valeurs
 * vides : on n'envoie donc que les champs réellement renseignés.
 */
export function buildCinetPayCustomerFields(customer: CheckoutCustomer): Record<string, string> {
  const fields: Record<string, string> = {};

  if (customer.name?.trim()) {
    const parts = customer.name.trim().split(/\s+/);
    const firstName = parts.shift();
    const lastName = parts.length > 0 ? parts.join(" ") : undefined;

    if (firstName) fields.customer_name = firstName;
    if (lastName) fields.customer_surname = lastName;
  }

  if (customer.email) fields.customer_email = customer.email;
  if (customer.phone) fields.customer_phone_number = normalizePhoneNumber(customer.phone);
  if (customer.address) fields.customer_address = customer.address;
  if (customer.city) fields.customer_city = customer.city;
  if (customer.country) fields.customer_country = customer.country;
  if (customer.state) fields.customer_state = customer.state;
  if (customer.zipCode) fields.customer_zip_code = customer.zipCode;

  return fields;
}

/**
 * CinetPay attend un numéro sans indicatif international explicite
 * (les 9 chiffres locaux). On retire espaces, « + » et préfixe 225.
 */
export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");

  if (digits.startsWith("225") && digits.length > 9) {
    return digits.slice(3);
  }

  return digits;
}

/** Convertit une valeur renvoyée par CinetPay en montant entier sûr. */
export function toAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

/** Réponse de l'endpoint d'initialisation CinetPay (`/v2/payment`). */
export interface CinetPayInitResponse {
  code: string;
  message: string;
  data?: {
    payment_token?: string;
    payment_url?: string;
  };
}

/** Réponse de l'endpoint de vérification CinetPay (`/v2/payment/check`). */
export interface CinetPayCheckResponse {
  code: string;
  message: string;
  data?: {
    amount?: unknown;
    currency?: string;
    status?: string;
    payment_method?: string;
    operator_id?: string;
    payment_date?: string;
  };
}

/** Champs normalisés extraits d'une réponse de vérification. */
export interface NormalizedCheckResult {
  status: PaymentStatus;
  amount: number | null;
  currency: string | null;
  method: string | null;
}

/**
 * Convertit la réponse de `/v2/payment/check` en résultat normalisé.
 * Tant que le code n'est pas « 00 », le paiement reste considéré en attente :
 * on ne valide jamais une commande sur une réponse ambiguë.
 */
export function mapCheckResponse(response: CinetPayCheckResponse): NormalizedCheckResult {
  if (response.code !== "00" || !response.data) {
    return { status: "pending", amount: null, currency: null, method: null };
  }

  return {
    status: normalizePaymentStatus(response.data.status),
    amount: toAmount(response.data.amount),
    currency: response.data.currency ?? null,
    method: response.data.payment_method ?? response.data.operator_id ?? null,
  };
}