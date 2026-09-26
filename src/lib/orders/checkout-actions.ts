"use server";

import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { getPaymentProvider } from "@/lib/payments";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createOrder } from "@/lib/orders/create-order";
import { checkoutSchema } from "@/lib/validation/checkout";

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
    return { ok: true, paymentUrl: "/mes-billets", orderReference: order.reference };
  }

  // Ouvre le paiement (mock → page simulation, CinetPay → page CinetPay).
  const supabase = await createSupabaseServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("title")
    .eq("id", parsed.data.eventId)
    .maybeSingle();

  const provider = getPaymentProvider();

  try {
    const session = await provider.createCheckout({
      orderId: order.orderId,
      orderReference: order.reference,
      amount: order.total,
      currency: env.currency,
      description: `Billets pour ${event?.title ?? "l’événement"}`,
      customer: {
        name: parsed.data.buyerName,
        email: parsed.data.buyerEmail || undefined,
        phone: parsed.data.buyerPhone || undefined,
      },
      returnUrl: `${env.appUrl}/commandes/${order.orderId}/retour`,
      notifyUrl: `${env.appUrl}/api/webhooks/cinetpay`,
    });

    // Journalise la transaction (règle métier n°12).
    await supabase.from("payments").insert({
      order_id: order.orderId,
      provider: session.provider,
      provider_transaction_id: session.transactionId,
      provider_payment_token: session.paymentToken,
      provider_payment_url: session.paymentUrl,
      amount: order.total,
      currency: env.currency,
      status: "initiated",
    });

    return { ok: true, paymentUrl: session.paymentUrl, orderReference: order.reference };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Ouverture du paiement impossible.",
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
