import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider, type PaymentProviderName } from "@/lib/payments";
import { sendEmail } from "@/lib/email";
import { ticketConfirmedEmail } from "@/lib/email/templates";

/* =============================================================================
   Confirmation d'une commande payée — point de passage unique
   --------------------------------------------------------------------------
   Appelé par : webhook CinetPay, callback de simulation mock, cron de
   réconciliation. Idempotent : rejouer deux fois ne crée ni billet ni
   notification en double (fonction SQL + garde sur le statut).
   ========================================================================== */

export interface ConfirmOrderResult {
  orderId: string;
  alreadyConfirmed: boolean;
  ticketsCreated: number;
}

export async function confirmPaidOrder(orderId: string): Promise<ConfirmOrderResult> {
  // Client admin : le webhook n'a pas de session utilisateur.
  const admin = createSupabaseAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, reference, status, user_id, event_id, buyer_email, buyer_name, total")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) throw new Error("Commande introuvable.");

  if (order.status === "paid") {
    const { data: created, error: ticketError } = await admin.rpc("generate_tickets_for_order", {
      target_order_id: orderId,
    });
    if (ticketError) throw new Error("Les billets n'ont pas pu être générés. Réessaie.");
    return {
      orderId,
      alreadyConfirmed: true,
      ticketsCreated: typeof created === "number" ? created : 0,
    };
  }

  if (order.status !== "pending") {
    throw new Error(`Commande non confirmable (statut : ${order.status}).`);
  }

  // 1. Bascule en payé + génération idempotente des billets.
  const { data: updated, error: updateError } = await admin
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError) throw new Error("Confirmation de la commande impossible.");
  if (!updated) {
    const { data: latest } = await admin.from("orders").select("status").eq("id", orderId).maybeSingle();
    if (latest?.status === "paid") {
      const { data: created, error: ticketError } = await admin.rpc("generate_tickets_for_order", {
        target_order_id: orderId,
      });
      if (ticketError) throw new Error("Les billets n'ont pas pu être générés. Réessaie.");
      return {
        orderId,
        alreadyConfirmed: true,
        ticketsCreated: typeof created === "number" ? created : 0,
      };
    }
    throw new Error("Cette commande a changé de statut avant sa confirmation.");
  }

  const { data: created, error: ticketError } = await admin.rpc("generate_tickets_for_order", {
    target_order_id: orderId,
  });
  if (ticketError) throw new Error("Les billets n'ont pas pu être générés. Réessaie.");

  const ticketsCreated = typeof created === "number" ? created : 0;

  // 2. Notification in-app (jamais bloquante).
  try {
    const { error: notificationError } = await admin.from("notifications").insert({
      user_id: order.user_id,
      type: "ticket_confirmed",
      title: "Billets confirmés 🎟️",
      body: `Commande ${order.reference} : tes billets sont disponibles.`,
      url: "/mes-billets",
      event_id: order.event_id,
    });
    if (notificationError) {
      console.error(
        "[confirmPaidOrder] Notification de billet non créée:",
        notificationError.message,
      );
    }
  } catch {
    // Une panne de notification ne doit pas annuler une commande déjà payée.
    console.error("[confirmPaidOrder] Échec inattendu de création de la notification de billet.");
  }

  // 3. Email de confirmation avec billets (jamais bloquant).
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.RAILWAY_PUBLIC_DOMAIN ??
    ""
  ).replace(/\/+$/, "");

  if (order.buyer_email) {
    const { data: event } = await admin
      .from("events")
      .select("title, start_at, venue_name, city")
      .eq("id", order.event_id)
      .maybeSingle();

    const { data: tickets } = await admin
      .from("tickets")
      .select("reference, ticket_type_id, holder_name, access_level")
      .eq("order_id", orderId);

    const typeNames = new Map<string, string>();
    if (tickets && tickets.length > 0) {
      const { data: types } = await admin
        .from("ticket_types")
        .select("id, name")
        .in(
          "id",
          tickets.map((t) => t.ticket_type_id),
        );
      for (const type of types ?? []) typeNames.set(type.id, type.name);
    }

    await sendEmail(
      ticketConfirmedEmail({
        to: order.buyer_email,
        name: order.buyer_name ?? undefined,
        eventTitle: event?.title ?? "Ton événement",
        eventStartAt: event?.start_at ?? new Date().toISOString(),
        venueName: event?.venue_name ?? null,
        city: event?.city ?? null,
        organizerName: "",
        orderReference: order.reference,
        totalAmount: Number(order.total),
        salonUrl: null,
        tickets: (tickets ?? []).map((ticket) => ({
          reference: ticket.reference,
          ticketTypeName: typeNames.get(ticket.ticket_type_id) ?? "Billet",
          accessLevelLabel: ticket.access_level,
          holderName: ticket.holder_name,
          ticketUrl: `${appUrl}/mes-billets`,
        })),
      }),
    );
  }

  return { orderId, alreadyConfirmed: false, ticketsCreated };
}

/** Vérifie une transaction auprès du prestataire puis confirme si acceptée. */
export async function verifyAndConfirm(transactionId: string): Promise<ConfirmOrderResult | null> {
  const admin = createSupabaseAdminClient();

  const { data: payment } = await admin
    .from("payments")
    .select("order_id, status, provider, amount, currency")
    .eq("provider_transaction_id", transactionId)
    .maybeSingle();

  if (!payment) {
    console.warn("[verifyAndConfirm] Aucun paiement trouvé pour la transaction", { transactionId });
    return null;
  }

  if (!isPaymentProviderName(payment.provider)) {
    throw new Error("Prestataire de paiement inconnu.");
  }

  const verification = await getPaymentProvider(payment.provider).verify(transactionId);

  console.info("[verifyAndConfirm] Résultat de la vérification", {
    transactionId,
    orderId: payment.order_id,
    provider: payment.provider,
    verificationStatus: verification.status,
    verificationAmount: verification.amount,
    verificationCurrency: verification.currency,
    expectedAmount: Math.round(Number(payment.amount)),
    expectedCurrency: payment.currency,
  });

  const amountMatches = verification.amount === Math.round(Number(payment.amount));
  const currencyMatches = verification.currency?.toUpperCase() === payment.currency.toUpperCase();

  if (verification.status === "accepted" && (!amountMatches || !currencyMatches)) {
    console.error("[verifyAndConfirm] ⚠️ Discordance montant/devise — paiement rejeté", {
      transactionId,
      orderId: payment.order_id,
      expectedAmount: Math.round(Number(payment.amount)),
      actualAmount: verification.amount,
      expectedCurrency: payment.currency,
      actualCurrency: verification.currency,
    });
    await admin
      .from("payments")
      .update({
        status: "error",
        payload: verification.raw as never,
        error_message:
          `Discordance : attendu ${Math.round(Number(payment.amount))} ${payment.currency}, reçu ${verification.amount} ${verification.currency}.`,
      })
      .eq("provider_transaction_id", transactionId)
      .eq("provider", payment.provider);
    return null;
  }

  await admin
    .from("payments")
    .update({
      status: verification.status,
      method: verification.method ?? undefined,
      payload: verification.raw as never,
      completed_at: verification.status === "accepted" ? new Date().toISOString() : undefined,
    })
    .eq("provider_transaction_id", transactionId)
    .eq("provider", payment.provider);

  if (verification.status === "refused" || verification.status === "cancelled") {
    console.info("[verifyAndConfirm] Paiement refusé/annulé par le prestataire", {
      transactionId,
      orderId: payment.order_id,
      status: verification.status,
    });
    await admin
      .from("orders")
      .update({ status: verification.status === "refused" ? "failed" : "cancelled" })
      .eq("id", payment.order_id)
      .eq("status", "pending");
    return null;
  }

  if (verification.status !== "accepted") {
    console.info("[verifyAndConfirm] Statut non final, en attente", {
      transactionId,
      orderId: payment.order_id,
      status: verification.status,
    });
    return null;
  }

  console.info("[verifyAndConfirm] ✅ Paiement accepté, confirmation en cours…", {
    transactionId,
    orderId: payment.order_id,
  });
  return confirmPaidOrder(payment.order_id);
}

function isPaymentProviderName(value: string): value is PaymentProviderName {
  return value === "mock" || value === "cinetpay" || value === "geniuspay";
}
