import { z } from "zod";

import { LIMITS } from "@/lib/constants";
import { phoneSchema } from "@/lib/validation/auth";

/* Schémas de validation du tunnel d'achat (client + serveur). */

const uuidSchema = z.string().uuid("Identifiant invalide.");

export const checkoutItemSchema = z.object({
  ticketTypeId: uuidSchema,
  quantity: z
    .number({ error: "Quantité invalide." })
    .int("Quantité invalide.")
    .min(1, "1 billet minimum.")
    .max(
      LIMITS.MAX_TICKETS_PER_ORDER,
      `${LIMITS.MAX_TICKETS_PER_ORDER} billets maximum par commande.`,
    ),
});

export const checkoutSchema = z.object({
  eventId: uuidSchema,
  /** Lignes : un type de billet → quantité. */
  items: z
    .array(checkoutItemSchema)
    .min(1, "Choisis au moins un billet.")
    .max(5, "Trop de lignes."),
  buyerName: z.string().trim().min(2, "2 caractères minimum.").max(120, "120 caractères maximum."),
  buyerEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email invalide.")
    .max(254)
    .optional()
    .or(z.literal("")),
  buyerPhone: phoneSchema,
  promoCode: z.string().trim().toUpperCase().max(32).optional().or(z.literal("")),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;

/** Builds the exact item array validated and submitted by the checkout form. */
export function checkoutItemsFromQuantities(
  ticketTypes: readonly { id: string }[],
  quantities: Readonly<Record<string, number>>,
): CheckoutItemInput[] {
  return ticketTypes
    .map(({ id }) => ({ ticketTypeId: id, quantity: quantities[id] ?? 0 }))
    .filter((item) => item.quantity > 0);
}
