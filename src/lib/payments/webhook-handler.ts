import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { confirmPaidOrder } from "@/lib/orders/confirm-order";

import { isPaidStatus, type PaymentProvider } from "./types";

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
    return NextResponse.json(
      { received: false, error: error instanceof Error ? error.message : "invalid_notification" },
      { status: 400 },
    );
  }

  if (!notification.signatureValid) {
    return NextResponse.json({ received: false, error: "bad_signature" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("order_id, amount, currency")
    .eq("provider_transaction_id", notification.transactionId)
    .eq("provider", notification.provider)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ received: true, matched: false });
  }

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
    try {
      const verification = await provider.verify(notification.transactionId);
      const amountMatches = verification.amount === Math.round(Number(payment.amount));
      const currencyMatches =
        verification.currency?.toUpperCase() === payment.currency.toUpperCase();

      if (!isPaidStatus(verification.status) || !amountMatches || !currencyMatches) {
        await admin
          .from("payments")
          .update({
            status: "error",
            payload: verification.raw as never,
            error_message:
              "La vérification du prestataire ne correspond pas au montant ou à la devise attendus.",
          })
          .eq("provider_transaction_id", notification.transactionId)
          .eq("provider", notification.provider);
        return NextResponse.json({ received: true, confirmed: false, reason: "verify_mismatch" });
      }

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

      await confirmPaidOrder(payment.order_id);
      return NextResponse.json({ received: true, confirmed: true });
    } catch {
      return NextResponse.json({ received: true, confirmed: false, reason: "verify_failed" });
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
