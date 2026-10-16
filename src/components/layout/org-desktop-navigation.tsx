"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
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

export function OrgDesktopNavigation() {
  const pathname = usePathname();
  const current = items.find((item) =>
    item.href === "/org"
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <nav aria-label="Navigation organisateur" className="hidden min-w-0 flex-col gap-1 lg:flex">
      {items.map(({ href, label, icon: Icon }) => {
        const active = current?.href === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-primary-subtle/70 text-primary-subtle-fg" : "text-fg-muted hover:bg-bg-muted hover:text-fg"}`}
          >
            <Icon
              className={`size-4 shrink-0 ${active ? "text-primary" : "text-fg-subtle"}`}
              aria-hidden="true"
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
