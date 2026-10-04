import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { confirmPaidOrder } from "@/lib/orders/confirm-order";

/* Confirmation simulée (mode mock). Refusée en production et en mode CinetPay. */

const bodySchema = z.object({
  orderId: z.string().uuid(),
  transactionId: z.string().min(1),
  decision: z.enum(["accepted", "refused", "cancelled"]),
});

export async function POST(request: NextRequest) {
  if (env.isProduction || env.payment.provider !== "mock") {
    return NextResponse.json({ ok: false, error: "Simulation désactivée." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  const { orderId, transactionId, decision } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Non authentifié." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  // La commande doit appartenir à l'utilisateur et être en attente.
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, status")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!order) {
    const { data: contribution } = await admin.from("cotisation_contributions")
      .select("id, status, provider_transaction_id")
      .eq("id", orderId).eq("contributor_id", user.id).eq("provider", "mock")
      .eq("provider_transaction_id", transactionId).maybeSingle();
    if (!contribution) return NextResponse.json({ ok: false, error: "Commande introuvable." }, { status: 404 });
    if (contribution.status !== "pending") return NextResponse.json({ ok: contribution.status === "paid" });
    const { error } = await admin.from("cotisation_contributions").update({
      status: decision === "accepted" ? "paid" : decision === "refused" ? "failed" : "cancelled",
      paid_at: decision === "accepted" ? new Date().toISOString() : null,
    }).eq("id", contribution.id).eq("status", "pending");
    if (error) return NextResponse.json({ ok: false, error: "Confirmation impossible." }, { status: 422 });
    return NextResponse.json({ ok: true });
  }

  await admin
    .from("payments")
    .update({
      status: decision === "accepted" ? "accepted" : decision === "refused" ? "refused" : "cancelled",
      completed_at: new Date().toISOString(),
      payload: { simulated: true, transactionId, decision } as never,
    })
    .eq("provider_transaction_id", transactionId);

  if (decision === "accepted") {
    try {
      await confirmPaidOrder(orderId);
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : "Confirmation impossible." },
        { status: 422 },
      );
    }
    return NextResponse.json({ ok: true });
  }

  await admin
    .from("orders")
    .update({ status: decision === "refused" ? "failed" : "cancelled" })
    .eq("id", orderId)
    .eq("status", "pending");

  return NextResponse.json({ ok: true });
}
