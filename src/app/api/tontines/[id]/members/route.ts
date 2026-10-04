import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, getApiUser, parseJson } from "@/lib/community-finance/api";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("respond"), accept: z.boolean() }),
  z.object({ action: z.literal("invite"), userIds: z.array(z.string().uuid()).min(1).max(30) }),
]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getApiUser();
  if (!user) return apiError("Connecte-toi pour gérer cette invitation.", 401);
  const parsed = schema.safeParse(await parseJson(request));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Requête invalide.");
  const { id } = await params;
  const admin = createSupabaseAdminClient();

  if (parsed.data.action === "respond") {
    const { data, error } = await admin.rpc("tontine_respond_invitation", {
      p_tontine_id: id,
      p_user_id: user.id,
      p_accept: parsed.data.accept,
    });
    if (error) return apiError(error.message || "Cette invitation n’est plus disponible.", 409);
    return NextResponse.json({ member: data });
  }

  const { data: tontine } = await admin.from("tontines").select("id, title, creator_id, status").eq("id", id).maybeSingle();
  if (!tontine || tontine.creator_id !== user.id) return apiError("Seul le créateur peut inviter des membres.", 403);
  if (tontine.status !== "active") return apiError("Cette tontine n’accepte plus de membres.", 409);
  const userIds = [...new Set(parsed.data.userIds)].filter((memberId) => memberId !== user.id);
  const { data: connections, error: connectionError } = await admin.from("connections")
    .select("requester_id, addressee_id").eq("status", "accepted").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
  const connected = new Set((connections ?? []).map((row) => row.requester_id === user.id ? row.addressee_id : row.requester_id));
  if (connectionError || userIds.some((memberId) => !connected.has(memberId))) {
    return apiError("Les membres doivent déjà être connectés à ton compte.", 403);
  }
  const { error } = await admin.from("tontine_members").upsert(userIds.map((memberId) => ({
    tontine_id: id,
    user_id: memberId,
    invited_by: user.id,
    role: "member" as const,
    status: "invited" as const,
  })), { onConflict: "tontine_id,user_id", ignoreDuplicates: true });
  if (error) return apiError("Les invitations n’ont pas pu être envoyées.", 500);
  await admin.from("notifications").insert(userIds.map((memberId) => ({
    user_id: memberId,
    actor_id: user.id,
    type: "tontine_invitation" as const,
    title: "Invitation à une tontine",
    body: tontine.title,
    url: `/tontines/${id}`,
  })));
  return NextResponse.json({ invited: userIds.length }, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getApiUser();
  if (!user) return apiError("Connecte-toi pour retirer un membre.", 401);
  const body = await parseJson(request) as { userId?: unknown } | null;
  if (!body || typeof body.userId !== "string") return apiError("Membre invalide.");
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data: tontine } = await admin.from("tontines").select("creator_id").eq("id", id).maybeSingle();
  if (!tontine || (tontine.creator_id !== user.id && body.userId !== user.id)) {
    return apiError("Tu n’es pas autorisé à retirer cette invitation.", 403);
  }
  const { error } = await admin.from("tontine_members").delete().eq("tontine_id", id)
    .eq("user_id", body.userId).eq("status", "invited");
  if (error) return apiError("L’invitation n’a pas pu être annulée.", 500);
  return NextResponse.json({ ok: true });
}
