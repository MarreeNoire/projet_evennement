import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, getApiUser, parseJson } from "@/lib/community-finance/api";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ paymentId: z.string().uuid(), status: z.literal("paid") });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getApiUser();
  if (!user) return apiError("Connecte-toi pour mettre à jour une cotisation.", 401);
  const parsed = schema.safeParse(await parseJson(request));
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
