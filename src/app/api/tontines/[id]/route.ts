import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, getApiUser, parseJson } from "@/lib/community-finance/api";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Context = { params: Promise<{ id: string }> };
const updateSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  contributionAmount: z.number().int().positive().max(100_000_000).optional(),
  status: z.enum(["active", "cancelled"]).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Aucune modification fournie.");

export async function GET(_request: Request, { params }: Context) {
  const user = await getApiUser();
  if (!user) return apiError("Connecte-toi pour consulter cette tontine.", 401);
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data: tontine } = await admin.from("tontines").select("*").eq("id", id).maybeSingle();
  if (!tontine) return apiError("Tontine introuvable.", 404);

  const { data: membership } = await admin.from("tontine_members").select("*")
    .eq("tontine_id", id).eq("user_id", user.id).maybeSingle();
  const isOwner = tontine.creator_id === user.id;
  if (!isOwner && (!membership || !["active", "invited"].includes(membership.status))) {
    return apiError("Tu n’as pas accès à cette tontine.", 403);
  }

  if (tontine.status === "active") {
    const { data: currentCycle } = await admin.rpc("tontine_ensure_current_period", {
      p_tontine_id: id,
      p_requested_by: user.id,
    });
    if (isOwner && currentCycle?.status === "pending") {
      await admin.rpc("draw_tontine_beneficiary", { p_tontine_id: id, p_requested_by: user.id });
    }
  }

  const [{ data: members }, { data: cycles }] = await Promise.all([
    admin.from("tontine_members").select("*").eq("tontine_id", id).order("created_at"),
    admin.from("tontine_cycles").select("*").eq("tontine_id", id).order("cycle_number", { ascending: false }),
  ]);
  const memberIds = [...new Set((members ?? []).map((member) => member.user_id))];
  const [{ data: profiles }, { data: payments }] = await Promise.all([
    memberIds.length
      ? admin.from("profiles").select("id, display_name, username, avatar_url").in("id", memberIds)
      : Promise.resolve({ data: [] }),
    cycles?.length
      ? admin.from("tontine_payments").select("*").in("cycle_id", cycles.map((cycle) => cycle.id))
      : Promise.resolve({ data: [] }),
  ]);
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const currentCycle = cycles?.[0] ?? null;

  return NextResponse.json({
    tontine,
    isOwner,
    membership: membership ?? { status: "active", role: "owner" },
    members: (members ?? []).map((member) => ({ ...member, profile: profileById.get(member.user_id) ?? null })),
    cycles: (cycles ?? []).map((cycle) => ({
      ...cycle,
      beneficiary: cycle.beneficiary_user_id ? profileById.get(cycle.beneficiary_user_id) ?? null : null,
      payments: (payments ?? []).filter((payment) => payment.cycle_id === cycle.id).map((payment) => ({
        ...payment,
        profile: profileById.get(payment.user_id) ?? null,
      })),
    })),
    currentCycle,
  });
}

export async function PATCH(request: Request, { params }: Context) {
  const user = await getApiUser();
  if (!user) return apiError("Connecte-toi pour modifier cette tontine.", 401);
  const parsed = updateSchema.safeParse(await parseJson(request));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Informations invalides.");
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data: current } = await admin.from("tontines").select("*").eq("id", id).eq("creator_id", user.id).maybeSingle();
  if (!current) return apiError("Tontine introuvable ou accès refusé.", 404);
  if (current.status === "completed" && parsed.data.status !== "cancelled") return apiError("Cette tontine est terminée.", 409);
  const { data, error } = await admin.from("tontines").update({
    ...(parsed.data.title ? { title: parsed.data.title } : {}),
    ...(parsed.data.contributionAmount ? { contribution_amount: parsed.data.contributionAmount } : {}),
    ...(parsed.data.status ? { status: parsed.data.status } : {}),
  }).eq("id", id).select("*").single();
  if (error) return apiError("La tontine n’a pas pu être modifiée.", 500);
  return NextResponse.json({ tontine: data });
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getApiUser();
  if (!user) return apiError("Connecte-toi pour supprimer cette tontine.", 401);
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data: tontine } = await admin.from("tontines").select("creator_id").eq("id", id).maybeSingle();
  if (!tontine || tontine.creator_id !== user.id) return apiError("Tontine introuvable ou accès refusé.", 404);
  const { data: drawn } = await admin.from("tontine_cycles").select("id").eq("tontine_id", id).eq("status", "drawn").limit(1);
  if (drawn?.length) return apiError("Un tirage existe déjà. Annule la tontine pour conserver son historique.", 409);
  const { error } = await admin.from("tontines").delete().eq("id", id).eq("creator_id", user.id);
  if (error) return apiError("La tontine n’a pas pu être supprimée.", 500);
  return NextResponse.json({ ok: true });
}
