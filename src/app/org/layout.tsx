import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Users,
  QrCode,
  BarChart3,
  Megaphone,
  UserCheck,
  Wallet,
  Settings,
  ArrowLeft,
} from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";
import { BecomeOrganizerForm } from "@/components/auth/become-organizer-form";
import { OrgMobileNavigation } from "@/components/layout/org-mobile-navigation";

const ORG_MENU_ITEMS = [
  { href: "/org", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/org/evenements", label: "Événements", icon: Calendar },
  { href: "/org/billetterie", label: "Billetterie", icon: Ticket },
  { href: "/org/participants", label: "Participants", icon: Users },
  { href: "/org/check-in", label: "Check-in", icon: QrCode },
  { href: "/org/analytics", label: "Statistiques", icon: BarChart3 },
  { href: "/org/marketing", label: "Marketing", icon: Megaphone },
  { href: "/org/equipe", label: "Équipe", icon: UserCheck },
  { href: "/org/paiements", label: "Paiements", icon: Wallet },
  { href: "/org/parametres", label: "Paramètres", icon: Settings },
];

export default async function OrgLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/connexion?redirect=/org");

  let canAccessOrganizationSpace = profile.roles.includes("organizer");
  if (!canAccessOrganizationSpace) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const [{ data: owned }, { data: memberships }] = await Promise.all([
        supabase.from("organizations").select("id").eq("owner_id", user.id).limit(1),
        supabase
          .from("organization_members")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .in("role", ["owner", "manager", "checkin_agent"])
          .limit(1),
      ]);
      canAccessOrganizationSpace = Boolean(owned?.length || memberships?.length);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <SiteHeader />
      <div className="container-page min-w-0 flex-1 py-4 sm:py-6 lg:py-8">
        {!canAccessOrganizationSpace ? (
          <div className="mx-auto max-w-xl py-12 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="font-display text-3xl font-bold tracking-tight">Activation de l&apos;Espace Organisateur</h1>
              <p className="text-sm text-fg-muted">
                Pour créer des événements et gérer votre billetterie, veuillez choisir le nom de votre organisation.
              </p>
            </div>
            <BecomeOrganizerForm user={{ displayName: profile.display_name }} />
          </div>
        ) : (
          <div className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
            {/* Navigation latérale Organisateur */}
            <aside className="min-w-0">
              <div className="-mx-4 border-y-2 border-fg bg-surface px-4 py-2 lg:mx-0 lg:border-x-0 lg:border-b-0 lg:p-4">
                <OrgMobileNavigation />
                <div className="mb-2 hidden min-w-0 items-center justify-between gap-2 border-b border-border-strong pb-2 lg:mb-4 lg:flex lg:pb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                    Espace Organisateur
                  </p>
                  <p className="hidden truncate font-display text-sm font-bold text-fg lg:block">
                    {profile.display_name}
                  </p>
                </div>

                <nav aria-label="Navigation organisateur" className="hidden min-w-0 gap-1 lg:mx-0 lg:flex lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
                  {ORG_MENU_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex min-h-11 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-medium text-fg-muted transition-colors hover:border-primary hover:bg-bg-muted hover:text-fg lg:min-h-0 lg:gap-3 lg:border-b-0 lg:border-l-2 lg:py-2.5"
                      >
                        <Icon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-2 hidden border-t border-border pt-4 lg:mt-6 lg:block">
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-xs font-medium text-fg-subtle hover:text-fg"
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
      <SiteFooter />
    </div>
  );
}
