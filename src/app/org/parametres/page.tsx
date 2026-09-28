import { redirect } from "next/navigation";

import { OrgSettingsForm } from "@/components/events/org-settings-form";
import { Alert } from "@/components/ui/states";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";

export const metadata = {
  title: "Paramètres de l'Organisation | Event",
  description: "Coordonnées du profil organisateur et informations de paiement.",
};

export default async function OrgParametresPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?redirect=/org/parametres");

  const supabase = await createSupabaseServerClient();
  const { data: ownedOrg, error: ownedError } = await supabase
    .from("organizations")
    .select("id, name, email, phone")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (ownedError) {
    return <Alert tone="danger" title="Paramètres indisponibles">Impossible de charger les coordonnées de l’organisation.</Alert>;
  }

  let organization = ownedOrg;
  if (!organization) {
    const { data: memberships, error: membershipError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .in("role", ["owner", "manager"])
      .order("joined_at", { ascending: true })
      .limit(1);

    if (membershipError) {
      return <Alert tone="danger" title="Paramètres indisponibles">Impossible de charger les coordonnées de l’organisation.</Alert>;
    }

    const organizationId = memberships?.[0]?.organization_id;
    if (organizationId) {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, email, phone")
        .eq("id", organizationId)
        .maybeSingle();
      if (error) {
        return <Alert tone="danger" title="Paramètres indisponibles">Impossible de charger les coordonnées de l’organisation.</Alert>;
      }
      organization = data;
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Paramètres de l&apos;Organisation</h1>
        <p className="text-sm text-fg-muted">
          Modifiez le nom de votre structure et ses coordonnées de contact.
        </p>
      </div>

      {organization ? (
        <OrgSettingsForm organization={organization} />
      ) : (
        <Alert tone="info" title="Aucune organisation trouvée">
          Créez une organisation ou demandez un accès de responsable pour gérer ses paramètres.
        </Alert>
      )}
    </div>
  );
}
