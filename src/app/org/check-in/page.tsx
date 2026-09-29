import { OrgCheckInScanner } from "@/components/events/org-check-in-scanner";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Contrôle d'accès & Check-in | Event",
  description: "Outil de validation et contrôle des billets à l'entrée des événements.",
};

export default async function OrgCheckInPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  let events: { id: string; title: string; start_at: string; city: string }[] = [];

  if (user) {
    const [{ data: ownedOrganizations }, { data: teamMemberships }] = await Promise.all([
      supabase.from("organizations").select("id").eq("owner_id", user.id),
      supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .in("role", ["owner", "manager", "checkin_agent"]),
    ]);
    const organizationIds = [...new Set([
      ...(ownedOrganizations ?? []).map(({ id }) => id),
      ...(teamMemberships ?? []).map(({ organization_id }) => organization_id),
    ])];

    if (organizationIds.length) {
      const { data } = await supabase
        .from("events")
        .select("id, title, start_at, city")
        .in("organization_id", organizationIds)
        .neq("status", "cancelled")
        .order("start_at", { ascending: true });
      events = data ?? [];
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Outil de Check-in à l&apos;entrée</h1>
        <p className="text-sm text-fg-muted">
          Choisissez l’événement, puis scannez le QR code ou vérifiez la référence du billet.
        </p>
      </div>

      <OrgCheckInScanner events={events} />
    </div>
  );
}
