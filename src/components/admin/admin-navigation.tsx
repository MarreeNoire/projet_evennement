"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Flag,
  LayoutDashboard,
  ScrollText,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { DashboardMobileNavigation } from "@/components/layout/dashboard-mobile-navigation";

const items = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/admin/evenements", label: "Événements", icon: Calendar },
  { href: "/admin/paiements", label: "Paiements & Commissions", icon: Wallet },
  { href: "/admin/moderation", label: "Signalements", icon: Flag },
  { href: "/admin/parametres", label: "Paramètres plateforme", icon: Settings },
  { href: "/admin/journal", label: "Journal d’audit", icon: ScrollText },
];

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <aside className="min-w-0">
      <div className="border-border bg-surface/85 -mx-4 border-y px-4 py-3 backdrop-blur-md lg:mx-0 lg:rounded-xl lg:border lg:p-4 lg:shadow-sm">
        <div className="border-border mb-3 flex items-center gap-3 border-b pb-3 lg:mb-4 lg:pb-3">
          <span className="bg-primary-subtle text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
            <LayoutDashboard className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-fg text-sm font-bold">Administration</p>
            <p className="text-fg-muted text-xs">Gestion de la plateforme</p>
          </div>
        </div>

        {(() => {
          const current =
            items.find(({ href }) =>
              href === "/admin" ? pathname === href : pathname.startsWith(href),
            ) ?? items[0]!;
          return (
            <>
              <DashboardMobileNavigation
                items={items}
                title="Administration"
                homeLabel="Quitter l’Administration"
                accent="admin"
              />
              <nav
                aria-label="Navigation administration"
                className="hidden min-w-0 gap-1 lg:flex lg:flex-col"
              >
                {items.map(({ href, label, icon: Icon }) => {
                  const active = current.href === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 min-w-0 items-center gap-3 rounded-md border-l py-2.5 pl-3 text-sm font-semibold transition-colors",
                        active
                          ? "border-primary bg-primary-subtle text-primary-subtle-fg"
                          : "text-fg-muted hover:bg-bg-muted hover:text-fg border-transparent",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 leading-tight">{label}</span>
                    </Link>
                  );
                })}
              </nav>
            </>
          );
        })()}

        <div className="border-border mt-4 hidden border-t pt-4 lg:block">
          <Link
            href="/"
            className="text-fg-subtle hover:text-fg flex items-center gap-2 text-xs font-medium"
          >
            <ArrowLeft className="size-3.5" /> Quitter l&apos;Administration
          </Link>
        </div>
      </div>
    </aside>
  );
}
