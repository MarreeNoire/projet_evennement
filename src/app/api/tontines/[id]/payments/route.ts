import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, getApiUser, parseJson } from "@/lib/community-finance/api";
import { env } from "@/lib/env";
import { getPaymentProvider } from "@/lib/payments";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const patchSchema = z.object({ paymentId: z.string().uuid(), status: z.literal("paid") });
const postSchema = z.object({ paymentId: z.string().uuid() });

/**
 * POST /api/tontines/[id]/payments
 * Démarrer le paiement en ligne (Mobile Money via GeniusPay / CinetPay) pour sa cotisation tontine.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getApiUser();
  if (!user) return apiError("Connecte-toi pour régler ta cotisation tontine.", 401);

  const parsed = postSchema.safeParse(await parseJson(request));
  if (!parsed.success) return apiError("Paiement invalide.");

  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const [{ data: tontine }, { data: payment }] = await Promise.all([
    admin.from("tontines").select("id, title, contribution_amount, currency").eq("id", id).maybeSingle(),
    admin.from("tontine_payments").select("*").eq("id", parsed.data.paymentId).eq("tontine_id", id).maybeSingle(),
  ]);

  if (!tontine || !payment) return apiError("Échéance de tontine introuvable.", 404);
  if (payment.user_id !== user.id) return apiError("Seul le membre concerné peut régler cette cotisation.", 403);
  if (payment.status === "paid") return apiError("Cette cotisation a déjà été réglée.", 409);

  const { data: profile } = await admin.from("profiles").select("display_name, email, phone, country").eq("id", user.id).maybeSingle();

  try {
    const provider = getPaymentProvider();
    const origin = env.appUrl.replace(/\/$/, "");

    const checkout = await provider.createCheckout({
      orderId: payment.id,
      orderReference: `TON-${payment.id.slice(0, 8)}`,
      amount: Number(payment.amount),
      currency: tontine.currency || "XOF",
      description: `Cotisation tontine - ${tontine.title}`,
      customer: {
        name: profile?.display_name ?? user.email ?? "Membre",
        email: profile?.email ?? user.email ?? undefined,
        phone: profile?.phone ?? undefined,
        country: profile?.country ?? "CI",
      },
      returnUrl: `${origin}/tontines/${id}?payment=${payment.id}`,
      notifyUrl: `${origin}/api/webhooks/${provider.name}`,
      metadata: {
        payment_id: payment.id,
        tontine_id: id,
        user_id: user.id,
      },
    });

    return NextResponse.json({ paymentId: payment.id, checkoutUrl: checkout.paymentUrl }, { status: 200 });
  } catch (error) {
    console.error("[tontine checkout error]", error);
    return apiError(error instanceof Error ? error.message : "Le paiement n'a pas pu démarrer.", 503);
  }
}

/**
 * PATCH /api/tontines/[id]/payments
 * Confirmation manuelle du paiement d'une cotisation par le créateur de la tontine.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getApiUser();
  if (!user) return apiError("Connecte-toi pour mettre à jour une cotisation.", 401);
  const parsed = patchSchema.safeParse(await parseJson(request));
  if (!parsed.success) return apiError("Cotisation invalide.");
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data: payment, error } = await admin.rpc("tontine_mark_payment_paid", {
    p_payment_id: parsed.data.paymentId,
    p_marked_by: user.id,
  });
  if (error || !payment || payment.tontine_id !== id) return apiError(error?.message || "Cotisation introuvable.", 403);

  const { data: cycle } = await admin.rpc("tontine_ensure_current_period", {
    p_tontine_id: id,
    p_requested_by: user.id,
  });
  if (cycle?.status === "pending") {
    await admin.rpc("draw_tontine_beneficiary", { p_tontine_id: id, p_requested_by: user.id });
  }
  return NextResponse.json({ payment });
}
