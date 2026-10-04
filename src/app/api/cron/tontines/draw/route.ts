import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function runScheduledDraws(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
    ?? request.headers.get("x-cron-secret")
    ?? "";
  if (!secret || supplied.length !== secret.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(secret))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: tontines, error } = await admin.from("tontines").select("id, creator_id")
    .eq("status", "active").limit(500);
  if (error) return NextResponse.json({ error: "Lecture des tontines impossible." }, { status: 500 });

  const results = await Promise.all((tontines ?? []).map(async (tontine) => {
    const { data: cycle, error: cycleError } = await admin.rpc("tontine_ensure_current_period", {
      p_tontine_id: tontine.id,
      p_requested_by: tontine.creator_id,
    });
    if (cycleError || !cycle || cycle.status === "drawn" || cycle.due_on > new Date().toISOString().slice(0, 10)) {
      return { id: tontine.id, drawn: false };
    }
    const { data: drawn, error: drawError } = await admin.rpc("draw_tontine_beneficiary", {
      p_tontine_id: tontine.id,
      p_requested_by: tontine.creator_id,
    });
    return { id: tontine.id, drawn: !drawError && drawn?.status === "drawn" };
  }));

  return NextResponse.json({ processed: results.length, drawn: results.filter((result) => result.drawn).length });
}

export const POST = runScheduledDraws;
export const GET = runScheduledDraws;
