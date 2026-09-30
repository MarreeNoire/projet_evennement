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
      <div className="-mx-4 border-y-2 border-danger bg-surface px-4 py-3 lg:mx-0 lg:border-x-0 lg:border-b-0 lg:p-4">
        <div className="mb-3 flex items-center gap-3 border-b border-border pb-3 lg:mb-4 lg:pb-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger-subtle text-danger">
            <LayoutDashboard className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-fg">Administration</p>
            <p className="text-xs text-fg-muted">Gestion de la plateforme</p>
          </div>
        </div>

        <nav aria-label="Navigation administration" className="grid grid-cols-2 gap-2 lg:flex lg:flex-col lg:gap-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors sm:text-sm lg:min-h-11 lg:rounded-md lg:border-0 lg:border-l-2 lg:py-2.5",
                  active
                    ? "border-danger/40 bg-danger-subtle text-danger lg:border-danger"
                    : "border-border bg-bg text-fg-muted hover:bg-bg-muted hover:text-fg lg:border-transparent lg:bg-transparent",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 leading-tight">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 hidden border-t border-border pt-4 lg:block">
          <Link href="/" className="flex items-center gap-2 text-xs font-medium text-fg-subtle hover:text-fg">
            <ArrowLeft className="size-3.5" /> Quitter l&apos;Administration
          </Link>
        </div>
      </div>
    </aside>
  );
}
