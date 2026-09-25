"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, MessageSquare, Ticket, User } from "lucide-react";

import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { HeaderUser } from "./header-types";

export function BottomNav({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();

  // Ne pas afficher dans l'espace organisateur ni dans l'administration (qui ont leur propre menu)
  if (pathname.startsWith("/org") || pathname.startsWith("/admin")) {
    return null;
  }

  const items = [
    {
      href: ROUTES.home,
      label: "Accueil",
      icon: Home,
      active: pathname === "/",
    },
    {
      href: ROUTES.explore,
      label: "Explorer",
      icon: Compass,
      active: pathname === ROUTES.explore || pathname.startsWith("/evenements"),
    },
    {
      href: ROUTES.mySalons,
      label: "Salons",
      icon: MessageSquare,
      active: pathname.startsWith("/salons") || pathname === ROUTES.mySalons,
    },
    {
      href: user ? ROUTES.myTickets : ROUTES.login,
      label: "Billets",
      icon: Ticket,
      active: pathname.startsWith("/billets") || pathname === ROUTES.myTickets,
    },
    {
      href: user ? ROUTES.profile : ROUTES.login,
      label: user ? "Moi" : "Compte",
      icon: User,
      active: pathname.startsWith("/profil"),
    },
  ];

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="grid h-14 grid-cols-5 items-stretch">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "-mt-px flex h-14 flex-col items-center justify-center gap-1 border-t-2",
                  item.active
                    ? "border-primary font-semibold text-primary"
                    : "border-transparent text-fg-muted hover:text-fg",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                <span className="text-2xs leading-none tracking-tight">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
