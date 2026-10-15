"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
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

        {(() => {
          const current = items.find(({ href }) => href === "/admin" ? pathname === href : pathname.startsWith(href)) ?? items[0]!;
          const CurrentIcon = current.icon;
          return (
            <>
              <details key={pathname} className="group lg:hidden">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md border border-border bg-bg px-3 text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 items-center gap-2"><CurrentIcon className="size-4 shrink-0 text-danger" aria-hidden="true" /><span className="truncate">{current.label}</span></span>
                  <ChevronDown className="size-4 shrink-0 text-fg-muted transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <nav aria-label="Navigation administration" className="mt-2 grid grid-cols-2 gap-2">
                  {items.map(({ href, label, icon: Icon }) => {
                    const active = current.href === href;
                    return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 min-w-0 items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold sm:text-sm", active ? "border-danger/40 bg-danger-subtle text-danger" : "border-border bg-bg text-fg-muted hover:bg-bg-muted hover:text-fg")}><Icon className="size-4 shrink-0" aria-hidden="true" /><span className="min-w-0 leading-tight">{label}</span></Link>;
                  })}
                </nav>
              </details>
              <nav aria-label="Navigation administration" className="hidden min-w-0 gap-1 lg:flex lg:flex-col">
                {items.map(({ href, label, icon: Icon }) => {
                  const active = current.href === href;
                  return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 min-w-0 items-center gap-3 rounded-md border-l-2 py-2.5 pl-3 text-sm font-semibold transition-colors", active ? "border-danger bg-danger-subtle text-danger" : "border-transparent text-fg-muted hover:bg-bg-muted hover:text-fg")}><Icon className="size-4 shrink-0" aria-hidden="true" /><span className="min-w-0 leading-tight">{label}</span></Link>;
                })}
              </nav>
            </>
          );
        })()}

        <div className="mt-4 hidden border-t border-border pt-4 lg:block">
          <Link href="/" className="flex items-center gap-2 text-xs font-medium text-fg-subtle hover:text-fg">
            <ArrowLeft className="size-3.5" /> Quitter l&apos;Administration
          </Link>
        </div>
      </div>
    </aside>
  );
}
