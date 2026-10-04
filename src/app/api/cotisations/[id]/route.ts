import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, getApiUser, parseJson } from "@/lib/community-finance/api";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Context = { params: Promise<{ id: string }> };
const updateSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  targetAmount: z.number().int().positive().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  status: z.enum(["open", "closed", "completed"]).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Aucune modification fournie.");

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data: campaign } = await admin.from("cotisation_campaigns").select("*").eq("id", id).maybeSingle();
  if (!campaign) {
    return apiError("Collecte introuvable.", 404);
  }
  const user = await getApiUser();
  const [{ data: totals }, { data: contributions }, { data: myContributions }] = await Promise.all([
    admin.rpc("cotisation_campaign_totals", { p_campaign_id: id }),
    admin.from("cotisation_contributions").select("id, contributor_id, amount, currency, is_anonymous, status, paid_at, created_at")
      .eq("campaign_id", id).eq("status", "paid").order("paid_at", { ascending: false }),
    user
      ? admin.from("cotisation_contributions").select("id, amount, currency, status, created_at")
          .eq("campaign_id", id).eq("contributor_id", user.id).order("created_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
  ]);
  const visibleContributions = contributions ?? [];
  const contributorIds = [...new Set(visibleContributions.filter((row) => !row.is_anonymous).map((row) => row.contributor_id))];
  const { data: profiles } = contributorIds.length
    ? await admin.from("profiles").select("id, display_name, avatar_url").in("id", contributorIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  return NextResponse.json({
    campaign,
    isOwner: user?.id === campaign.creator_id,
    totalAmount: totals?.[0]?.total_amount ?? 0,
    contributorCount: totals?.[0]?.contributor_count ?? 0,
    contributions: visibleContributions.map((row) => ({
      id: row.id,
      amount: row.amount,
      currency: row.currency,
      is_anonymous: row.is_anonymous,
      status: row.status,
      paid_at: row.paid_at,
      created_at: row.created_at,
      profile: row.is_anonymous ? null : profileById.get(row.contributor_id) ?? null,
    })),
    myContributions: myContributions ?? [],
  });
}

export async function PATCH(request: Request, { params }: Context) {
  const user = await getApiUser();
  if (!user) return apiError("Connecte-toi pour modifier cette collecte.", 401);
  const parsed = updateSchema.safeParse(await parseJson(request));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Informations invalides.");
  if (parsed.data.endsAt && new Date(parsed.data.endsAt) <= new Date()) return apiError("La date de fin doit être dans le futur.");
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data: current } = await admin.from("cotisation_campaigns").select("id, creator_id").eq("id", id).eq("creator_id", user.id).maybeSingle();
  if (!current) return apiError("Collecte introuvable ou accès refusé.", 404);
  const { data, error } = await admin.from("cotisation_campaigns").update({
    ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
    ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
    ...(parsed.data.targetAmount !== undefined ? { target_amount: parsed.data.targetAmount } : {}),
    ...(parsed.data.endsAt !== undefined ? { ends_at: parsed.data.endsAt } : {}),
    ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
  }).eq("id", id).select("*").single();
  if (error) return apiError("La collecte n’a pas pu être modifiée.", 500);
  return NextResponse.json({ campaign: data });
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getApiUser();
  if (!user) return apiError("Connecte-toi pour supprimer cette collecte.", 401);
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data: campaign } = await admin.from("cotisation_campaigns").select("creator_id").eq("id", id).maybeSingle();
  if (!campaign || campaign.creator_id !== user.id) return apiError("Collecte introuvable ou accès refusé.", 404);
  const { data: paid } = await admin.from("cotisation_contributions").select("id").eq("campaign_id", id).eq("status", "paid").limit(1);
  if (paid?.length) return apiError("Cette collecte a reçu des paiements. Clôture-la pour conserver l’historique.", 409);
  const { error } = await admin.from("cotisation_campaigns").delete().eq("id", id);
  if (error) return apiError("La collecte n’a pas pu être supprimée.", 500);
  return NextResponse.json({ ok: true });
}
