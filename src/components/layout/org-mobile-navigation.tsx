"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ArrowLeft,
  Calendar,
  ChevronDown,
  LayoutDashboard,
  Megaphone,
  QrCode,
  Settings,
  Ticket,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

const items = [
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

export function OrgMobileNavigation() {
  const pathname = usePathname();
  const currentItem =
    items.find((item) => item.href === pathname) ??
    items.find((item) => item.href !== "/org" && pathname.startsWith(`${item.href}/`)) ??
    items[0];
  const CurrentIcon = currentItem.icon;

  return (
    <details key={pathname} className="group lg:hidden">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 border border-border bg-surface px-3 text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-2">
          <CurrentIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="truncate">{currentItem.label}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-fg-muted transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <nav aria-label="Navigation organisateur" className="mt-2 grid grid-cols-2 gap-1 border border-border bg-surface p-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === currentItem.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 min-w-0 items-center gap-2 px-2 text-sm transition-colors ${
                active
                  ? "bg-primary-subtle text-primary-subtle-fg font-semibold"
                  : "text-fg-muted hover:bg-bg-muted hover:text-fg"
              }`}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        <Link
          href="/"
          className="col-span-2 flex min-h-11 items-center gap-2 border-t border-border px-2 pt-1 text-sm font-medium text-fg-muted hover:text-fg"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Retour au site public
        </Link>
      </nav>
    </details>
  );
}
