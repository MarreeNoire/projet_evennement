import { redirect } from "next/navigation";

import { BecomeOrganizerForm } from "@/components/auth/become-organizer-form";
import { EditorialFooter } from "@/components/layout/editorial/editorial-footer";
import { EditorialScope } from "@/components/layout/editorial/editorial-shell";
import { DashboardNavigation } from "@/components/layout/dashboard-navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { loadHeaderUser } from "@/lib/auth/viewer";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";

export default async function OrgLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/connexion?redirect=/org");

  const viewer = await loadHeaderUser();

  const supabase = await createSupabaseServerClient();
  const [{ data: owned }, { data: memberships }] = await Promise.all([
    supabase.from("organizations").select("id").eq("owner_id", profile.id).limit(1),
    supabase
      .from("organization_members")
      .select("id")
      .eq("user_id", profile.id)
      .eq("status", "active")
      .in("role", ["owner", "manager", "checkin_agent", "moderator"])
      .limit(1),
  ]);
  const canAccessOrganizationSpace = Boolean(owned?.length || memberships?.length);

  return (
    <EditorialScope>
      <div className="dashboard-shell bg-bg flex min-h-dvh flex-col">
        <SiteHeader />
        <div className="container-page min-w-0 flex-1 py-4 sm:py-6 lg:py-8">
          {!canAccessOrganizationSpace ? (
            <div className="mx-auto max-w-xl space-y-6 py-12">
              <div className="space-y-2 text-center">
                <h1 className="font-display text-3xl font-bold tracking-tight">
                  Activation de l&apos;Espace Organisateur
                </h1>
                <p className="text-fg-muted text-sm">
                  Pour créer des événements et gérer votre billetterie, veuillez choisir le nom de
                  votre organisation.
                </p>
              </div>
              <BecomeOrganizerForm user={{ displayName: profile.display_name }} />
            </div>
          ) : (
            <div className="grid min-w-0 gap-4 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 lg:pb-0">
              <DashboardNavigation
                variant="organizer"
                title="Espace organisateur"
                description="Gestion des événements"
                profileName={profile.display_name}
                returnLabel="Retour au site public"
              />

              {/* Zone de contenu principal */}
              <main id="contenu" className="min-w-0">
                {children}
              </main>
            </div>
          )}
        </div>
        <EditorialFooter viewer={viewer} />
      </div>
    </EditorialScope>
  );
}
