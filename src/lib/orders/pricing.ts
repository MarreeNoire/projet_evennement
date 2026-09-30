import { PLATFORM_COMMISSION_RATE } from "@/lib/constants";
import type { TicketTypeRow } from "@/types/database";

/* =============================================================================
   Calculs du tunnel d'achat — source unique (client + serveur)
   --------------------------------------------------------------------------
   La règle métier : le serveur recalcule TOUJOURS les montants depuis la base
   (jamais confiance aux totaux envoyés par le navigateur). Le client utilise
   ces mêmes fonctions pour afficher un récapitulatif identique.
   ========================================================================== */

export interface PricedLine {
  ticketTypeId: string;
  name: string;
  accessLevel: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderPricing {
  lines: PricedLine[];
  ticketCount: number;
  subtotal: number;
  discount: number;
  fees: number;
  total: number;
  commission: number;
  netForOrganizer: number;
}

/** Calcule le sous-total, la remise, les frais et la commission (5 %). */
export function priceOrder(
  lines: Array<{ ticketType: Pick<TicketTypeRow, "id" | "name" | "price" | "access_level">; quantity: number }>,
  options: { promoDiscount?: number; commissionRate?: number } = {},
): OrderPricing {
  const priced: PricedLine[] = lines.map(({ ticketType, quantity }) => ({
    ticketTypeId: ticketType.id,
    name: ticketType.name,
    accessLevel: ticketType.access_level,
    unitPrice: ticketType.price,
    quantity,
    lineTotal: ticketType.price * quantity,
  }));

  const ticketCount = priced.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = priced.reduce((sum, line) => sum + line.lineTotal, 0);
  const discount = Math.min(Math.max(options.promoDiscount ?? 0, 0), subtotal);
  const fees = 0; // Pas de frais acheteur au lancement (décision produit).
  const total = Math.max(subtotal - discount + fees, 0);
  const commissionRate = Number.isFinite(options.commissionRate)
    ? Math.min(Math.max(options.commissionRate!, 0), 1)
    : PLATFORM_COMMISSION_RATE;
  const commission = Math.round(total * commissionRate);
  const netForOrganizer = total - commission;

  return { lines: priced, ticketCount, subtotal, discount, fees, total, commission, netForOrganizer };
}

/** Vérifie qu'une quantité respecte les bornes du type de billet. */
export function checkQuantityBounds(
  quantity: number,
  ticketType: Pick<TicketTypeRow, "min_per_order" | "max_per_order" | "quantity" | "sold_count">,
): string | null {
  if (quantity < ticketType.min_per_order) {
    return `Minimum ${ticketType.min_per_order} billet(s) pour ce tarif.`;
  }
  if (quantity > ticketType.max_per_order) {
    return `Maximum ${ticketType.max_per_order} billet(s) pour ce tarif.`;
  }
  const remaining = ticketType.quantity - ticketType.sold_count;
  if (quantity > remaining) {
    return remaining <= 0 ? "Ce tarif est épuisé." : `Plus que ${remaining} place(s) pour ce tarif.`;
  }
  return null;
}

/** Vérifie la fenêtre de vente d'un type de billet. */
export function checkSaleWindow(
  ticketType: Pick<TicketTypeRow, "sale_start" | "sale_end">,
  now: Date = new Date(),
): string | null {
  if (ticketType.sale_start && new Date(ticketType.sale_start) > now) {
    return "La vente n'a pas encore commencé pour ce tarif.";
  }
  if (ticketType.sale_end && new Date(ticketType.sale_end) < now) {
    return "La vente est terminée pour ce tarif.";
  }
  return null;
}
