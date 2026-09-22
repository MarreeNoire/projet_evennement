import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider, isPaidStatus } from "@/lib/payments";
import { confirmPaidOrder } from "@/lib/orders/confirm-order";

/* =============================================================================
   Webhook de paiement — POST /api/webhooks/cinetpay
   --------------------------------------------------------------------------
   * Ne fait JAMAIS confiance à la notification seule : revérifie chaque
     transaction acceptée par un appel serveur-à-serveur (`verify`) avant de
     confirmer la commande.
   * Idempotent : rejouer la notification ne crée rien en double.
   * Répond toujours 200 (sauf erreur technique) pour éviter les rejeux agressifs.
   ========================================================================== */

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ received: false, error: "invalid_json" }, { status: 400 });
  }

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  let notification;
  try {
    notification = await getPaymentProvider().parseNotification(payload, headers);
  } catch (error) {
    return NextResponse.json(
      { received: false, error: error instanceof Error ? error.message : "invalid_notification" },
      { status: 400 },
    );
  }

  if (!notification.signatureValid) {
    return NextResponse.json({ received: false, error: "bad_signature" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Retrouve la commande via la transaction journalisée.
  const { data: payment } = await admin
    .from("payments")
    .select("order_id, status, amount")
    .eq("provider_transaction_id", notification.transactionId)
    .eq("provider", notification.provider)
    .maybeSingle();

  if (!payment) {
    // Transaction inconnue : on l'enregistre pour audit et on répond 200.
    return NextResponse.json({ received: true, matched: false });
  }

  // Journalise la notification brute (audit, règle n°12).
  await admin
    .from("payments")
    .update({
      status: notification.status,
      method: notification.method ?? undefined,
      channel: undefined,
      payer_phone: notification.payerPhone ?? undefined,
      payload: notification.raw as never,
      error_message: null,
      completed_at:
        notification.status === "accepted" || notification.status === "refused"
          ? new Date().toISOString()
          : undefined,
    })
    .eq("provider_transaction_id", notification.transactionId);

  // Sécurité : si « accepté », on revérifie côté serveur avant de livrer.
  if (isPaidStatus(notification.status)) {
    try {
      const verification = await getPaymentProvider().verify(notification.transactionId);

      await admin
        .from("payments")
        .update({
          status: verification.status,
          amount: verification.amount ?? payment.amount,
          payload: verification.raw as never,
          completed_at: verification.status === "accepted" ? new Date().toISOString() : undefined,
        })
        .eq("provider_transaction_id", notification.transactionId);

      if (isPaidStatus(verification.status)) {
        await confirmPaidOrder(payment.order_id);
        return NextResponse.json({ received: true, confirmed: true });
      }

      return NextResponse.json({ received: true, confirmed: false, reason: "verify_mismatch" });
    } catch {
      return NextResponse.json({ received: true, confirmed: false, reason: "verify_failed" });
    }
  }

  // Refus / annulation : marque la commande en échec (sans billets).
  if (notification.status === "refused" || notification.status === "cancelled") {
    await admin
      .from("orders")
      .update({ status: notification.status === "refused" ? "failed" : "cancelled" })
      .eq("id", payment.order_id)
      .eq("status", "pending");
  }

  return NextResponse.json({ received: true, confirmed: false });
}
