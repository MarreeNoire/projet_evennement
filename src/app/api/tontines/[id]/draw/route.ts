import { NextResponse } from "next/server";

import { apiError, getApiUser } from "@/lib/community-finance/api";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getApiUser();
  if (!user) return apiError("Connecte-toi pour effectuer le tirage.", 401);
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("draw_tontine_beneficiary", {
    p_tontine_id: id,
    p_requested_by: user.id,
  });
  if (error) return apiError(error.message || "Le tirage n’a pas pu être effectué.", 409);
  return NextResponse.json({ cycle: data });
}
