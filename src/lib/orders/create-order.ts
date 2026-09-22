import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateReference } from "@/lib/utils";
import { checkoutSchema, hasContact, type CheckoutInput } from "@/lib/validation/checkout";
import { checkQuantityBounds, checkSaleWindow, priceOrder } from "@/lib/orders/pricing";

/* =============================================================================
   Création de commande — action serveur
   --------------------------------------------------------------------------
   Règles appliquées :
   * montants recalculés depuis la base (jamais ceux du navigateur) ;
   * commande gratuite (total = 0) confirmée immédiatement, sans prestataire ;
   * commande payante : statut `pending`, redirection vers le prestataire.
   ========================================================================== */

export interface CreateOrderResult {
  orderId: string;
  reference: string;
  total: number;
  /** `true` si billets déjà générés (commande gratuite). */
  confirmed: boolean;
}

export async function createOrder(input: CheckoutInput): Promise<CreateOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Commande invalide.");
  }

  const values = parsed.data;
  if (!hasContact(values)) {
    throw new Error("Indique au moins un email ou un numéro de téléphone.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Connecte-toi pour commander.");

  // Événement publié + organisation (montants jamais issus du client).
  const { data: event } = await supabase
    .from("events")
    .select("id, organization_id, status, currency")
    .eq("id", values.eventId)
    .maybeSingle();

  if (!event || event.status !== "published") {
    throw new Error("Cet événement n'est plus disponible à la vente.");
  }

  // Types de billets : prix et stocks lus en base.
  const typeIds = values.items.map((item) => item.ticketTypeId);
  const { data: ticketTypes } = await supabase
    .from("ticket_types")
    .select("*")
    .in("id", typeIds)
    .eq("event_id", values.eventId)
    .eq("is_active", true);

  if (!ticketTypes || ticketTypes.length !== typeIds.length) {
    throw new Error("Un tarif sélectionné n'est plus disponible.");
  }

  // Contrôles bornes + fenêtres de vente.
  for (const item of values.items) {
    const type = ticketTypes.find((t) => t.id === item.ticketTypeId);
    if (!type) throw new Error("Un tarif sélectionné n'est plus disponible.");
    const windowError = checkSaleWindow(type);
    if (windowError) throw new Error(`${type.name} : ${windowError}`);
    const boundsError = checkQuantityBounds(item.quantity, type);
    if (boundsError) throw new Error(`${type.name} : ${boundsError}`);
  }

  // Code promo (optionnel, non bloquant si invalide).
  let promoId: string | null = null;
  let promoDiscount = 0;
  const promoCode = values.promoCode?.trim().toUpperCase();
  if (promoCode) {
    const { data: promo } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", promoCode)
      .eq("is_active", true)
      .maybeSingle();
    if (promo && (!promo.event_id || promo.event_id === values.eventId)) {
      promoId = promo.id;
    }
  }

  const pricing = priceOrder(
    values.items.map((item) => ({
      ticketType: ticketTypes.find((t) => t.id === item.ticketTypeId)!,
      quantity: item.quantity,
    })),
    { promoDiscount },
  );

  const reference = generateReference("CMD");

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      reference,
      user_id: user.id,
      event_id: values.eventId,
      organization_id: event.organization_id,
      status: pricing.total === 0 ? "paid" : "pending",
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      fees: pricing.fees,
      total: pricing.total,
      commission: pricing.commission,
      currency: event.currency ?? "XOF",
      promo_code_id: promoId,
      buyer_name: values.buyerName.trim(),
      buyer_email: values.buyerEmail?.trim() || null,
      buyer_phone: values.buyerPhone?.trim() || null,
      paid_at: pricing.total === 0 ? new Date().toISOString() : null,
    })
    .select("id, reference, total")
    .single();

  if (error || !order) {
    throw new Error("Création de la commande impossible. Réessaie.");
  }

  // Lignes figées (prix du jour, quantités).
  const { error: itemsError } = await supabase.from("order_items").insert(
    pricing.lines.map((line) => ({
      order_id: order.id,
      ticket_type_id: line.ticketTypeId,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      line_total: line.lineTotal,
    })),
  );

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    throw new Error("Création de la commande impossible. Réessaie.");
  }

  // Gratuite : génère les billets immédiatement (fonction SQL idempotente).
  if (pricing.total === 0) {
    await supabase.rpc("generate_tickets_for_order", { target_order_id: order.id });
    return { orderId: order.id, reference: order.reference, total: 0, confirmed: true };
  }

  return { orderId: order.id, reference: order.reference, total: order.total, confirmed: false };
}
