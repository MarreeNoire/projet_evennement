"use server";

import { redirect } from "next/navigation";

import { getPaymentProvider } from "@/lib/payments";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createOrder } from "@/lib/orders/create-order";
import { checkoutSchema } from "@/lib/validation/checkout";
import { env } from "@/lib/env";

/* =============================================================================
   Action : créer la commande puis ouvrir le paiement
   --------------------------------------------------------------------------
   Retourne l'URL de redirection vers le prestataire (ou mes-billets si gratuit).
   Le formulaire client appelle cette action et redirige via `window.location`.
   ========================================================================== */

export interface StartCheckoutResult {
  ok: boolean;
  paymentUrl?: string;
  orderReference?: string;
  error?: string;
}

export async function startCheckout(raw: unknown): Promise<StartCheckoutResult> {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Commande invalide." };
  }

  let order;
  try {
    order = await createOrder(parsed.data);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Commande impossible." };
  }

  // Commande gratuite : billets déjà générés.
  if (order.confirmed) {
    let paymentUrl = "/mes-billets";
    try {
      const supabase = await createSupabaseServerClient();
      const { data: event } = await supabase
        .from("events")
        .select("slug")
        .eq("id", parsed.data.eventId)
        .maybeSingle();
      const { data: salon } = await supabase
        .from("salons")
        .select("id")
        .eq("event_id", parsed.data.eventId)
        .limit(1)
        .maybeSingle();
      if (event?.slug && salon) paymentUrl = `/evenements/${event.slug}/salon`;
    } catch {
      // La réservation est confirmée : un échec de recherche du salon ne doit pas la bloquer.
    }
    return { ok: true, paymentUrl, orderReference: order.reference };
  }

  // Ouvre le paiement (simulation ou checkout hébergé par le prestataire actif).
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> | null = null;
  try {
    supabase = await createSupabaseServerClient();
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("title")
      .eq("id", parsed.data.eventId)
      .maybeSingle();
    if (eventError || !event) throw new Error("Événement indisponible. Réessaie.");

    const provider = getPaymentProvider();
    const session = await provider.createCheckout({
      orderId: order.orderId,
      orderReference: order.reference,
      amount: order.total,
      currency: order.currency,
      description: `Billets pour ${event?.title ?? "l’événement"}`,
      customer: {
        name: parsed.data.buyerName,
        email: parsed.data.buyerEmail || undefined,
        phone: parsed.data.buyerPhone || undefined,
        country: "CI",
      },
      returnUrl: `${env.appUrl}/commandes/${order.orderId}/retour`,
      notifyUrl: `${env.appUrl}/api/webhooks/${provider.name}`,
    });

    // Journalise la transaction (règle métier n°12).
    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: order.orderId,
      provider: session.provider,
      provider_transaction_id: session.transactionId,
      provider_payment_token: session.paymentToken,
      provider_payment_url: session.paymentUrl,
      amount: order.total,
      currency: order.currency,
      status: "initiated",
    });
    if (paymentError) {
      console.error("[startCheckout] Enregistrement du paiement impossible.", paymentError.message);
      throw new Error("Impossible de préparer le paiement. Aucune redirection n’a été effectuée.");
    }

    return { ok: true, paymentUrl: session.paymentUrl, orderReference: order.reference };
  } catch (error) {
    if (supabase) {
      const { error: cancelError } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", order.orderId)
        .eq("status", "pending");
      if (cancelError) {
        console.error("[startCheckout] Impossible d’annuler la commande en échec.", cancelError.message);
      }
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Ouverture du paiement impossible. Réessaie.",
    };
  }
}

/** Redirige vers mes billets si la commande est déjà payée (page retour). */
export async function redirectIfPaid(orderId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();
  if (order?.status === "paid") redirect("/mes-billets");
}
