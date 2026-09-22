import { createHmac, timingSafeEqual } from "node:crypto";

/* =============================================================================
   Signature des notifications CinetPay
   --------------------------------------------------------------------------
   Vérification HMAC-SHA256 destinée à détecter les charges utiles forgées ou
   rejouées. Le résultat est journalisé mais NE décide jamais seul de la
   validation financière : celle-ci provient toujours d'un appel
   serveur-à-serveur (`/v2/payment/check`).
   ========================================================================== */

/** Champs d'une notification CinetPay utilisés pour la signature. */
export interface CinetPayRawFields {
  cpm_site_id?: string;
  cpm_trans_id?: string;
  cpm_trans_date?: string;
  cpm_amount?: string | number;
  cpm_currency?: string;
  cpm_payid?: string;
  cpm_payment_config?: string;
  cpm_page_action?: string;
  cpm_version?: string;
}

/**
 * Calcule la signature attendue pour une notification.
 * L'ordre de concaténation est celui documenté par CinetPay.
 */
export function computeCinetPaySignature(fields: CinetPayRawFields, secretKey: string): string {
  const concatenated = [
    fields.cpm_site_id ?? "",
    fields.cpm_trans_id ?? "",
    fields.cpm_trans_date ?? "",
    fields.cpm_amount ?? "",
    fields.cpm_currency ?? "",
    fields.cpm_payid ?? "",
    fields.cpm_payment_config ?? "",
    fields.cpm_page_action ?? "",
    fields.cpm_version ?? "",
  ].join("");

  return createHmac("sha256", secretKey).update(concatenated, "utf8").digest("hex");
}

/**
 * Compare la signature reçue à la signature attendue, en temps constant
 * (protection contre les attaques temporelles).
 */
export function isCinetPaySignatureValid(
  fields: CinetPayRawFields,
  providedSignature: string | undefined,
  secretKey: string,
): boolean {
  if (!providedSignature || !secretKey) return false;

  const expected = computeCinetPaySignature(fields, secretKey);
  const provided = providedSignature.trim().toLowerCase();

  if (expected.length !== provided.length) return false;

  try {
    return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(provided, "utf8"));
  } catch {
    return false;
  }
}

/** CinetPay attend le nom et le prénom séparés. */
export function splitCustomerName(fullName?: string): { name?: string; surname?: string } {
  if (!fullName?.trim()) return {};

  const parts = fullName.trim().split(/\s+/);
  const name = parts.shift();
  const surname = parts.length > 0 ? parts.join(" ") : undefined;

  return { name, surname };
}

/** Récupère `order_reference` depuis le champ `cpm_custom` (JSON sérialisé). */
export function extractOrderReference(custom: string | undefined): string | null {
  if (!custom) return null;

  try {
    const parsed = JSON.parse(custom) as Record<string, unknown>;
    const reference = parsed.order_reference;
    return reference ? String(reference) : null;
  } catch {
    return null;
  }
}