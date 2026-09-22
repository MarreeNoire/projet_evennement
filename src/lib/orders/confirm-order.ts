import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider } from "@/lib/payments";
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
    return { orderId, alreadyConfirmed: true, ticketsCreated: 0 };
  }

  if (order.status !== "pending") {
    throw new Error(`Commande non confirmable (statut : ${order.status}).`);
  }

  // 1. Bascule en payé + génération idempotente des billets.
  const { error: updateError } = await admin
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "pending");

  if (updateError) throw new Error("Confirmation de la commande impossible.");

  const { data: created } = await admin.rpc("generate_tickets_for_order", {
    target_order_id: orderId,
  });

  const ticketsCreated = typeof created === "number" ? created : 0;

  // 2. Notification in-app (jamais bloquante).
  try {
    await admin.from("notifications").insert({
      user_id: order.user_id,
      type: "ticket_confirmed",
      title: "Billets confirmés 🎟️",
      body: `Commande ${order.reference} : tes billets sont disponibles.`,
      url: "/mes-billets",
      event_id: order.event_id,
    });
  } catch {
    // Journalisé côté Supabase, ne bloque pas le parcours.
  }

  // 3. Email de confirmation avec billets (jamais bloquant).
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
        totalAmount: 0,
        salonUrl: null,
        tickets: (tickets ?? []).map((ticket) => ({
          reference: ticket.reference,
          ticketTypeName: typeNames.get(ticket.ticket_type_id) ?? "Billet",
          accessLevelLabel: ticket.access_level,
          holderName: ticket.holder_name,
          ticketUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/mes-billets`,
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
    .select("order_id, status")
    .eq("provider_transaction_id", transactionId)
    .maybeSingle();

  if (!payment) return null;

  const verification = await getPaymentProvider().verify(transactionId);

  await admin
    .from("payments")
    .update({
      status: verification.status,
      method: verification.method ?? undefined,
      payload: verification.raw as never,
      completed_at: verification.status === "accepted" ? new Date().toISOString() : undefined,
    })
    .eq("provider_transaction_id", transactionId);

  if (verification.status !== "accepted") return null;

  return confirmPaidOrder(payment.order_id);
}
