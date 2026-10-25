import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { BecomeOrganizerForm } from "@/components/auth/become-organizer-form";
import { EditorialFooter } from "@/components/layout/editorial/editorial-footer";
import { EditorialScope } from "@/components/layout/editorial/editorial-shell";
import { OrgDesktopNavigation } from "@/components/layout/org-desktop-navigation";
import { OrgMobileNavigation } from "@/components/layout/org-mobile-navigation";
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
      <div className="bg-bg flex min-h-dvh flex-col">
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
            <div className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
              {/* Navigation latérale Organisateur */}
              <aside className="min-w-0">
                <div className="border-border bg-surface/85 -mx-4 border-y px-4 py-3 backdrop-blur-md lg:mx-0 lg:rounded-xl lg:border lg:p-4 lg:shadow-sm">
                  <OrgMobileNavigation />
                  <div className="border-border-strong mb-2 hidden min-w-0 items-center justify-between gap-2 border-b pb-2 lg:mb-4 lg:flex lg:pb-4">
                    <p className="text-fg-subtle text-xs font-semibold tracking-wider uppercase">
                      Espace Organisateur
                    </p>
                    <p className="font-display text-fg hidden truncate text-sm font-bold lg:block">
                      {profile.display_name}
                    </p>
                  </div>

                  <OrgDesktopNavigation />

                  <div className="border-border mt-2 hidden border-t pt-4 lg:mt-6 lg:block">
                    <Link
                      href="/"
                      className="text-fg-subtle hover:text-fg flex items-center gap-2 text-xs font-medium"
                    >
                      <ArrowLeft className="size-3.5" /> Retour au site public
                    </Link>
                  </div>
                </div>
              </aside>

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
