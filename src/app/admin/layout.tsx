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
    <div className="flex min-h-dvh flex-col bg-bg-subtle/50">
      <SiteHeader />
      <div className="container-page flex-1 py-8">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Navigation latérale Admin */}
          <aside className="space-y-6">
            <div className="rounded-xl border border-danger/30 bg-surface p-4 shadow-sm">
              <div className="mb-4 border-b border-border pb-3 flex items-center justify-between">
                <div>
                  <p className="text-2xs font-bold uppercase tracking-wider text-danger">
                    Administration
                  </p>
                  <p className="font-display text-sm font-bold text-fg truncate">
                    Super Admin
                  </p>
                </div>
                <ShieldAlert className="size-5 text-danger" />
              </div>

              <nav className="flex flex-col gap-1">
                {ADMIN_MENU_ITEMS.map((item) => {
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
