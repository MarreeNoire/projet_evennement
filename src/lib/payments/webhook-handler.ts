import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { confirmPaidOrder } from "@/lib/orders/confirm-order";

import { isPaidStatus, type PaymentProvider } from "./types";

/* =============================================================================
   Gestionnaire unifié des webhooks de paiement
   --------------------------------------------------------------------------
   Reçoit les notifications de CinetPay / GeniusPay, vérifie la signature,
   reconcilie la transaction et confirme la commande si le paiement est accepté.

   IMPORTANT : un code HTTP ≥ 500 signale au prestataire qu'il doit relancer
   la notification. On ne renvoie donc 200 que si le traitement est terminé
   (succès OU rejet définitif), et 500 si un problème transitoire empêche la
   confirmation (timeout réseau, panne Supabase…).
   ========================================================================== */

export async function handlePaymentWebhook(request: Request, provider: PaymentProvider) {
  const rawBody = await request.text();
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ received: false, error: "invalid_json" }, { status: 400 });
  }

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  let notification;
  try {
    notification = await provider.parseNotification(payload, headers, rawBody);
  } catch (error) {
    console.error("[webhook] Notification invalide", {
      provider: provider.name,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { received: false, error: error instanceof Error ? error.message : "invalid_notification" },
      { status: 400 },
    );
  }

  if (!notification.signatureValid) {
    console.error("[webhook] Signature invalide", {
      provider: notification.provider,
      transactionId: notification.transactionId,
    });
    return NextResponse.json({ received: false, error: "bad_signature" }, { status: 401 });
  }

  if (
    notification.provider === "geniuspay" &&
    notification.environment &&
    notification.environment !== provider.environment
  ) {
    console.error("[webhook] Environnement webhook incompatible", {
      expected: provider.environment,
      received: notification.environment,
    });
    return NextResponse.json(
      { received: false, error: "environment_mismatch" },
      { status: 400 },
    );
  }

  if (notification.testEvent) {
    return NextResponse.json({ received: true, test: true });
  }

  const admin = createSupabaseAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("order_id, amount, currency")
    .eq("provider_transaction_id", notification.transactionId)
    .eq("provider", notification.provider)
    .maybeSingle();

  if (!payment) {
    // Pas de paiement correspondant en base : peut être un doublon ou un
    // webhook arrivé avant l'insertion (race condition). On renvoie 404 pour
    // demander au prestataire de relancer plus tard.
    console.error("[webhook] Paiement non trouvé en base", {
      provider: notification.provider,
      transactionId: notification.transactionId,
      status: notification.status,
    });
    return NextResponse.json({ received: false, matched: false }, { status: 404 });
  }

  // Journalise la notification brute (étape non bloquante).
  await admin
    .from("payments")
    .update({
      status: notification.status,
      method: notification.method ?? undefined,
      payer_phone: notification.payerPhone ?? undefined,
      payload: notification.raw as never,
      error_message: null,
      completed_at:
        notification.status === "accepted" || notification.status === "refused"
          ? new Date().toISOString()
          : undefined,
    })
    .eq("provider_transaction_id", notification.transactionId)
    .eq("provider", notification.provider);

  if (isPaidStatus(notification.status)) {
    // Vérification serveur-à-serveur : seule source de vérité financière.
    let verification;
    try {
      verification = await provider.verify(notification.transactionId);
    } catch (verifyError) {
      // Erreur transitoire (timeout réseau, API indisponible…).
      // On renvoie 500 pour que le prestataire relance la notification.
      console.error("[webhook] Échec de la vérification auprès du prestataire", {
        provider: notification.provider,
        transactionId: notification.transactionId,
        orderId: payment.order_id,
        error: verifyError instanceof Error ? verifyError.message : String(verifyError),
      });
      await admin
        .from("payments")
        .update({
          error_message: `Vérification échouée : ${verifyError instanceof Error ? verifyError.message : "erreur inconnue"}`,
        })
        .eq("provider_transaction_id", notification.transactionId)
        .eq("provider", notification.provider);
      return NextResponse.json(
        { received: true, confirmed: false, reason: "verify_failed" },
        { status: 500 },
      );
    }

    const amountMatches = verification.amount === Math.round(Number(payment.amount));
    const currencyMatches =
      verification.currency?.toUpperCase() === payment.currency.toUpperCase();

    if (!isPaidStatus(verification.status) || !amountMatches || !currencyMatches) {
      console.error("[webhook] Discordance lors de la vérification", {
        provider: notification.provider,
        transactionId: notification.transactionId,
        orderId: payment.order_id,
        verificationStatus: verification.status,
        isPaid: isPaidStatus(verification.status),
        expectedAmount: Math.round(Number(payment.amount)),
        actualAmount: verification.amount,
        amountMatches,
        expectedCurrency: payment.currency,
        actualCurrency: verification.currency,
        currencyMatches,
      });
      await admin
        .from("payments")
        .update({
          status: "error",
          payload: verification.raw as never,
          error_message: !isPaidStatus(verification.status)
            ? `Le prestataire indique un statut "${verification.status}" au lieu de "accepted".`
            : `Discordance : attendu ${Math.round(Number(payment.amount))} ${payment.currency}, reçu ${verification.amount} ${verification.currency}.`,
        })
        .eq("provider_transaction_id", notification.transactionId)
        .eq("provider", notification.provider);
      // Rejet définitif → 200 (relancer ne changera rien).
      return NextResponse.json({ received: true, confirmed: false, reason: "verify_mismatch" });
    }

    // Vérification OK : mise à jour du paiement puis confirmation de la commande.
    await admin
      .from("payments")
      .update({
        status: verification.status,
        amount: verification.amount ?? payment.amount,
        payload: verification.raw as never,
        completed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("provider_transaction_id", notification.transactionId)
      .eq("provider", notification.provider);

    try {
      await confirmPaidOrder(payment.order_id);
      console.info("[webhook] ✅ Commande confirmée", {
        provider: notification.provider,
        transactionId: notification.transactionId,
        orderId: payment.order_id,
      });
      return NextResponse.json({ received: true, confirmed: true });
    } catch (confirmError) {
      // La confirmation a échoué (erreur DB, génération de billets…).
      // On renvoie 500 pour que le prestataire relance.
      console.error("[webhook] Paiement vérifié mais confirmation échouée", {
        provider: notification.provider,
        transactionId: notification.transactionId,
        orderId: payment.order_id,
        error: confirmError instanceof Error ? confirmError.message : String(confirmError),
      });
      await admin
        .from("payments")
        .update({
          error_message: `Confirmation échouée : ${confirmError instanceof Error ? confirmError.message : "erreur inconnue"}`,
        })
        .eq("provider_transaction_id", notification.transactionId)
        .eq("provider", notification.provider);
      return NextResponse.json(
        { received: true, confirmed: false, reason: "confirm_failed" },
        { status: 500 },
      );
    }
  }

  if (notification.status === "refused" || notification.status === "cancelled") {
    await admin
      .from("orders")
      .update({ status: notification.status === "refused" ? "failed" : "cancelled" })
      .eq("id", payment.order_id)
      .eq("status", "pending");
  }

  return NextResponse.json({ received: true, confirmed: false });
}
