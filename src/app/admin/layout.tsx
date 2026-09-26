import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ShieldAlert,
  Users,
  Calendar,
  Wallet,
  Flag,
  Settings,
  ArrowLeft,
  LayoutDashboard,
} from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getCurrentProfile } from "@/lib/supabase/server";

const ADMIN_MENU_ITEMS = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/admin/evenements", label: "Événements", icon: Calendar },
  { href: "/admin/paiements", label: "Paiements & Commissions", icon: Wallet },
  { href: "/admin/moderation", label: "Signalements", icon: Flag },
  { href: "/admin/parametres", label: "Paramètres Plateforme", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile || !profile.roles.includes("admin")) redirect("/");

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <SiteHeader />
      <div className="container-page flex-1 py-8">
        <div className="grid min-w-0 gap-5 lg:gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Navigation latérale Admin */}
          <aside className="min-w-0">
            <div className="-mx-4 border-y-2 border-danger bg-surface px-4 py-2 lg:mx-0 lg:border-x-0 lg:border-b-0 lg:p-4">
              <div className="mb-2 flex items-center justify-between gap-2 border-b border-border pb-2 lg:mb-4 lg:pb-3">
                <div>
                  <p className="text-2xs font-bold uppercase tracking-wider text-danger">
                    Administration
                  </p>
                  <p className="hidden truncate font-display text-sm font-bold text-fg lg:block">
                    Super Admin
                  </p>
                </div>
                <ShieldAlert className="size-5 text-danger" />
              </div>

              <nav aria-label="Navigation administration" className="no-scrollbar -mx-4 flex min-w-0 gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
                {ADMIN_MENU_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex min-h-11 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-medium text-fg-muted transition-colors hover:border-danger hover:bg-bg-muted hover:text-fg lg:min-h-0 lg:gap-3 lg:border-b-0 lg:border-l-2 lg:py-2.5"
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
                  <ArrowLeft className="size-3.5" /> Quitter l&apos;Administration
                </Link>
              </div>
            </div>
          </aside>

          {/* Zone de contenu principal */}
          <main id="contenu" className="min-w-0">
            {children}
          </main>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
