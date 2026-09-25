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
import { getCurrentProfile } from "@/lib/supabase/server";
import { BecomeOrganizerForm } from "@/components/auth/become-organizer-form";

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

  const isOrganizer = profile.roles.includes("organizer");

  return (
    <div className="flex min-h-dvh flex-col bg-bg-subtle/50">
      <SiteHeader />
      <div className="container-page flex-1 py-8">
        {!isOrganizer ? (
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
          <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
            {/* Navigation latérale Organisateur */}
            <aside className="space-y-6">
              <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <div className="mb-4 border-b border-border pb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                    Espace Organisateur
                  </p>
                  <p className="font-display text-sm font-bold text-fg truncate">
                    {profile.display_name}
                  </p>
                </div>

                <nav className="flex flex-col gap-1">
                  {ORG_MENU_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-fg-muted hover:bg-bg-muted hover:text-fg transition-colors"
                      >
                        <Icon className="size-4 text-fg-subtle" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-6 border-t border-border pt-4">
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
