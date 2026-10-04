import { NextResponse } from "next/server";

import { apiError, getApiUser } from "@/lib/community-finance/api";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const user = await getApiUser();
  if (!user) return apiError("Connecte-toi pour voir tes connexions.", 401);
  const admin = createSupabaseAdminClient();
  const { data: connections, error } = await admin.from("connections")
    .select("requester_id, addressee_id").eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
  if (error) return apiError("Les connexions ne sont pas disponibles.", 500);
  const ids = [...new Set((connections ?? []).map((row) => row.requester_id === user.id ? row.addressee_id : row.requester_id))];
  const { data: profiles } = ids.length
    ? await admin.from("profiles").select("id, display_name, username, avatar_url").in("id", ids).order("display_name")
    : { data: [] };
  return NextResponse.json({ invitees: profiles ?? [] });
}
