import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TontineCycleRow } from "@/types/database";
import type { CotisationItem } from "@/components/community-finance/cotisation-horizontal-list";
import type { TontineItem } from "@/components/community-finance/tontine-horizontal-list";

/* =============================================================================
   Requêtes côté serveur pour les modules Tontines et Cotisations
   --------------------------------------------------------------------------
   Même logique que GET /api/tontines et GET /api/cotisations, extraite ici
   pour être appelée directement depuis un Server Component (page d'accueil).
   Les routes API restent inchangées pour les pages dédiées qui en ont besoin
   (création, pagination, re-fetch côté client).
   ========================================================================== */

/** Tontines de l'utilisateur connecté (créées ou rejointes). Tableau vide si non connecté. */
export async function getHomeTontines(limit = 10): Promise<TontineItem[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const admin = createSupabaseAdminClient();
  const [{ data: owned }, { data: memberships }] = await Promise.all([
    admin
      .from("tontines")
      .select("*")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false }),
    admin
      .from("tontine_members")
      .select("tontine_id, status, role")
      .eq("user_id", user.id)
      .in("status", ["active", "invited"]),
  ]);

  const membershipById = new Map((memberships ?? []).map((row) => [row.tontine_id, row]));
  const ownedIds = new Set((owned ?? []).map((row) => row.id));
  const invitedIds = [...membershipById.keys()].filter((id) => !ownedIds.has(id));
  const { data: invited } = invitedIds.length
    ? await admin
        .from("tontines")
        .select("*")
        .in("id", invitedIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const tontines = [...(owned ?? []), ...(invited ?? [])].slice(0, limit);
  const ids = tontines.map((row) => row.id);

  const { data: members } = ids.length
    ? await admin.from("tontine_members").select("*").in("tontine_id", ids)
    : { data: [] };
  const memberIds = [...new Set((members ?? []).map((member) => member.user_id))];
  const { data: profiles } = memberIds.length
    ? await admin
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", memberIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const { data: latestCycles } = ids.length
    ? await admin
        .from("tontine_cycles")
        .select("*")
        .in("tontine_id", ids)
        .order("cycle_number", { ascending: false })
    : { data: [] };
  const cycleByTontine = new Map<string, TontineCycleRow>();
  for (const cycle of latestCycles ?? [])
    if (!cycleByTontine.has(cycle.tontine_id)) cycleByTontine.set(cycle.tontine_id, cycle);

  return tontines.map((tontine) => ({
    ...tontine,
    membership: membershipById.get(tontine.id) ?? { status: "active", role: "owner" },
    members: (members ?? [])
      .filter((member) => member.tontine_id === tontine.id)
      .map((member) => ({
        ...member,
        profile: profileById.get(member.user_id) ?? null,
      })),
    latestCycle: cycleByTontine.get(tontine.id) ?? null,
  })) as unknown as TontineItem[];
}

/** Collectes de cotisations ouvertes, visibles de tous (connecté ou non). */
export async function getOpenCotisations(limit = 10): Promise<CotisationItem[]> {
  const admin = createSupabaseAdminClient();
  const { data: campaigns, error } = await admin
    .from("cotisation_campaigns")
    .select("*")
    .eq("status", "open")
    .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getOpenCotisations]", error.message);
    return [];
  }

  const rows = await Promise.all(
    (campaigns ?? []).map(async (campaign) => {
      const [{ data: totals }, { data: creator }] = await Promise.all([
        admin.rpc("cotisation_campaign_totals", { p_campaign_id: campaign.id }),
        admin
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", campaign.creator_id)
          .maybeSingle(),
      ]);
      return {
        ...campaign,
        totalAmount: totals?.[0]?.total_amount ?? 0,
        contributorCount: totals?.[0]?.contributor_count ?? 0,
        creator,
      };
    }),
  );

  return rows as unknown as CotisationItem[];
}
