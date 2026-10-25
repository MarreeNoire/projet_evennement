"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, MessageSquare, Ticket, User } from "lucide-react";

import { ROUTES } from "@/lib/constants";
import { haptic } from "@/lib/ui/haptics";
import { cn } from "@/lib/utils";

import type { HeaderUser } from "./header-types";
import styles from "./mobile-chrome.module.css";

/* =============================================================================
   Barre d'onglets mobile
   --------------------------------------------------------------------------
   Matière translucide, filet d'un pixel et contenu qui s'efface dessous : la
   barre flotte au-dessus de la page au lieu de la clore. L'onglet actif se lit
   à la pastille, à la graisse et à la teinte — jamais à la couleur seule.

   Rendu uniquement sous 768 px (règle du module + `md:hidden`) et masqué dans
   l'espace organisateur et l'administration, qui ont leur propre navigation.
   ========================================================================== */

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
    <nav aria-label="Navigation mobile" className={cn(styles.tabbar, "md:hidden")}>
      <ul className={styles.list}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label} className="min-w-0">
              <Link
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                onPointerDown={() => haptic("light")}
                className={styles.tab}
              >
                <span className={styles.iconWrap}>
                  <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className={styles.label}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
