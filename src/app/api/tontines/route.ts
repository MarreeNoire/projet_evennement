import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, getApiUser, parseJson } from "@/lib/community-finance/api";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TontineCycleRow } from "@/types/database";

const createSchema = z.object({
  title: z.string().trim().min(3).max(120),
  contributionAmount: z.number().int().positive().max(100_000_000),
  startsOn: z.string().date(),
  memberIds: z.array(z.string().uuid()).min(1).max(30),
});

export async function GET() {
  const user = await getApiUser();
  if (!user) return apiError("Connecte-toi pour consulter tes tontines.", 401);

  const admin = createSupabaseAdminClient();
  const [{ data: owned }, { data: memberships }] = await Promise.all([
    admin.from("tontines").select("*").eq("creator_id", user.id).order("created_at", { ascending: false }),
    admin.from("tontine_members").select("tontine_id, status, role").eq("user_id", user.id).in("status", ["active", "invited"]),
  ]);
  const membershipById = new Map((memberships ?? []).map((row) => [row.tontine_id, row]));
  const ownedIds = new Set((owned ?? []).map((row) => row.id));
  const invitedIds = [...membershipById.keys()].filter((id) => !ownedIds.has(id));
  const { data: invited } = invitedIds.length
    ? await admin.from("tontines").select("*").in("id", invitedIds).order("created_at", { ascending: false })
    : { data: [] };
  const tontines = [...(owned ?? []), ...(invited ?? [])];
  const ids = tontines.map((row) => row.id);
  const { data: members } = ids.length
    ? await admin.from("tontine_members").select("*").in("tontine_id", ids)
    : { data: [] };
  const memberIds = [...new Set((members ?? []).map((member) => member.user_id))];
  const { data: profiles } = memberIds.length
    ? await admin.from("profiles").select("id, display_name, username, avatar_url").in("id", memberIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const { data: latestCycles } = ids.length
    ? await admin.from("tontine_cycles").select("*").in("tontine_id", ids).order("cycle_number", { ascending: false })
    : { data: [] };
  const cycleByTontine = new Map<string, TontineCycleRow>();
  for (const cycle of latestCycles ?? []) if (!cycleByTontine.has(cycle.tontine_id)) cycleByTontine.set(cycle.tontine_id, cycle);

  return NextResponse.json({
    tontines: tontines.map((tontine) => ({
      ...tontine,
      membership: membershipById.get(tontine.id) ?? { status: "active", role: "owner" },
      members: (members ?? []).filter((member) => member.tontine_id === tontine.id).map((member) => ({
        ...member,
        profile: profileById.get(member.user_id) ?? null,
      })),
      latestCycle: cycleByTontine.get(tontine.id) ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return apiError("Connecte-toi pour créer une tontine.", 401);
  const parsed = createSchema.safeParse(await parseJson(request));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Informations invalides.");

  const values = parsed.data;
  if (values.startsOn < new Date().toISOString().slice(0, 10)) return apiError("La date de début doit être aujourd’hui ou dans le futur.");
  const memberIds = [...new Set(values.memberIds)].filter((id) => id !== user.id);
  if (!memberIds.length) return apiError("Ajoute au moins un autre participant à la tontine.");

  const admin = createSupabaseAdminClient();
  const { data: connections, error: connectionsError } = await admin
    .from("connections")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
  if (connectionsError) return apiError("Impossible de vérifier la liste des participants.", 500);
  const connectedIds = new Set((connections ?? []).map((row) => row.requester_id === user.id ? row.addressee_id : row.requester_id));
  if (memberIds.some((id) => !connectedIds.has(id))) {
    return apiError("Tu peux inviter uniquement des personnes déjà connectées à ton compte.", 403);
  }

  const { data: group, error } = await admin.from("tontines").insert({
    creator_id: user.id,
    title: values.title,
    contribution_amount: values.contributionAmount,
    starts_on: values.startsOn,
  }).select("*").single();
  if (error || !group) return apiError("La tontine n’a pas pu être créée.", 500);

  const members = [
    { tontine_id: group.id, user_id: user.id, invited_by: user.id, role: "owner" as const, status: "active" as const, joined_at: new Date().toISOString() },
    ...memberIds.map((memberId) => ({ tontine_id: group.id, user_id: memberId, invited_by: user.id, role: "member" as const, status: "invited" as const })),
  ];
  const { error: membersError } = await admin.from("tontine_members").insert(members);
  if (membersError) {
    await admin.from("tontines").delete().eq("id", group.id);
    return apiError("La liste des membres n’a pas pu être enregistrée.", 500);
  }

  await admin.from("notifications").insert(memberIds.map((memberId) => ({
    user_id: memberId,
    actor_id: user.id,
    type: "tontine_invitation" as const,
    title: "Invitation à une tontine",
    body: `${values.title} · ${(values.contributionAmount).toLocaleString("fr-FR")} F CFA par mois`,
    url: `/tontines/${group.id}`,
  })));

  return NextResponse.json({ tontine: group }, { status: 201 });
}
