import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, getApiUser, parseJson } from "@/lib/community-finance/api";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const createSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  targetAmount: z.number().int().positive().max(10_000_000_000).nullable(),
  fixedAmount: z.number().int().positive().max(10_000_000).nullable(),
  endsAt: z.string().datetime().nullable(),
});

export async function GET() {
  const admin = createSupabaseAdminClient();
  const { data: campaigns, error } = await admin.from("cotisation_campaigns").select("*")
    .eq("status", "open").or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });
  if (error) return apiError("Les collectes ne sont pas disponibles pour le moment.", 500);
  const rows = await Promise.all((campaigns ?? []).map(async (campaign) => {
    const [{ data: totals }, { data: creator }] = await Promise.all([
      admin.rpc("cotisation_campaign_totals", { p_campaign_id: campaign.id }),
      admin.from("profiles").select("display_name, avatar_url").eq("id", campaign.creator_id).maybeSingle(),
    ]);
    return { ...campaign, totalAmount: totals?.[0]?.total_amount ?? 0, contributorCount: totals?.[0]?.contributor_count ?? 0, creator };
  }));
  return NextResponse.json({ campaigns: rows });
}

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return apiError("Connecte-toi pour créer une collecte.", 401);
  const parsed = createSchema.safeParse(await parseJson(request));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Informations invalides.");
  const values = parsed.data;
  if (values.endsAt && new Date(values.endsAt) <= new Date()) return apiError("La date de fin doit être dans le futur.");

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("cotisation_campaigns")
    .insert({
      creator_id: user.id,
      title: values.title,
      description: values.description,
      target_amount: values.targetAmount,
      fixed_amount: values.fixedAmount,
      ends_at: values.endsAt,
    })
    .select("*")
    .single();
  if (error || !data) {
    if (error) {
      console.error("[POST /api/cotisations] Supabase insert failed", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    }
    const schemaMissing = error?.code === "42P01" || error?.code === "PGRST205";
    return apiError(
      schemaMissing
        ? "Le module Cotisations n’est pas encore activé sur la base de données. Applique la migration Supabase des cotisations."
        : "La collecte n’a pas pu être créée. Réessaie dans un instant ou contacte le support si le problème persiste.",
      500,
    );
  }
  return NextResponse.json({ campaign: data }, { status: 201 });
}
