"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, Compass, MessageSquare, QrCode, Settings, Ticket, User, Users, type LucideIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

import { LogoMark } from "@/components/brand/logo";
import { ROUTES } from "@/lib/constants";
import { haptic } from "@/lib/ui/haptics";
import { cn } from "@/lib/utils";

import type { HeaderUser } from "./header-types";

/* =============================================================================
   Navigation latérale unique (rail tablette → barre latérale desktop)
   --------------------------------------------------------------------------
   - 768–1023 px (md)    : rail compact, icônes seules, 76 px (var(--rail-w)).
   - ≥1024 px (lg)       : barre latérale fixe avec libellés (var(--side-w)),
                           réductible via la classe html `side-rail-collapsed`.
   - Le décalage du contenu est appliqué sur <body> dans globals.css via
     `body:has(#app-side-rail)` — aucune page n'a besoin d'être modifiée.
   - Invisible dans /org et /admin, qui ont leur propre navigation.
   - La déconnexion reste dans le menu utilisateur (desktop) et la page Profil /
     Réglages (mobile) — aucune logique métier ici.
   ========================================================================== */

interface RailItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Badge numérique (notifications non lues). */
  badge?: number;
}

/* --- État partagé « barre latérale réduite ? » (en-tête + rail) ----------- */

const SIDE_STORE_KEY = "event_sidebar_collapsed";
let sideCollapsedState = false;
const sideListeners = new Set<() => void>();

function applySideCollapsed(value: boolean) {
  sideCollapsedState = value;
  document.documentElement.classList.toggle("side-rail-collapsed", value);
  try {
    localStorage.setItem(SIDE_STORE_KEY, value ? "1" : "0");
  } catch {
    // localStorage indisponible — ignorer.
  }
}

if (typeof window !== "undefined") {
  try {
    if (localStorage.getItem(SIDE_STORE_KEY) === "1") {
      sideCollapsedState = true;
      document.documentElement.classList.add("side-rail-collapsed");
    }
  } catch {
    // localStorage indisponible — ignorer.
  }
}

/** Vu et imprimé par l'en-tête (bouton) et le rail (largeur). */
export const sideRailStore = {
  get: () => sideCollapsedState,
  subscribe: (listener: () => void) => {
    sideListeners.add(listener);
    return () => {
      sideListeners.delete(listener);
    };
  },
  set(value: boolean) {
    applySideCollapsed(value);
    sideListeners.forEach((listener) => listener());
  },
};

export function useSideCollapsed(): [boolean, (value: boolean) => void] {
  const collapsed = useSyncExternalStore(sideRailStore.subscribe, sideRailStore.get, () => false);
  return [collapsed, sideRailStore.set];
}

function getRailItems(user: HeaderUser | null, unreadCount: number): RailItem[] {
  const items: RailItem[] = [
    { href: ROUTES.explore, label: "Événements", icon: Compass },
    { href: ROUTES.myTickets, label: "Billets", icon: Ticket },
    { href: ROUTES.mySalons, label: "Salons", icon: MessageSquare },
    { href: ROUTES.connections, label: "Réseau", icon: Users },
    { href: ROUTES.notifications, label: "Notifications", icon: Bell, badge: unreadCount },
    { href: ROUTES.profile, label: "Mon profil", icon: User },
  ];

  if (user?.isOrganizer) {
    items.push({ href: ROUTES.orgDashboard, label: "Espace organisateur", icon: CalendarDays });
  }

  return items;
}

export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === ROUTES.home) return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Titre + destination de retour pour l'en-tête mobile des pages de détail. */
export function getMobileHeaderTitle(pathname: string): { label: string; backTo: string } | null {
  const rules: Array<[string, { label: string; backTo: string }]> = [
    ["/salons/", { label: "Salon", backTo: ROUTES.mySalons }],
    ["/evenements/", { label: "Événement", backTo: ROUTES.explore }],
    ["/billets/", { label: "Billet", backTo: ROUTES.myTickets }],
    ["/profil/", { label: "Membre", backTo: ROUTES.connections }],
  ];

  for (const [prefix, info] of rules) {
    if (pathname.startsWith(prefix)) return info;
  }
  return null;
}

export function AppSideRail({ user, unreadCount }: { user: HeaderUser | null; unreadCount: number }) {
  const pathname = usePathname();
  const [collapsed] = useSideCollapsed();

  if (pathname.startsWith("/org") || pathname.startsWith("/admin")) return null;

  const items = getRailItems(user, unreadCount);

  return (
    <aside
      id="app-side-rail"
      data-collapsed={collapsed ? "true" : "false"}
      aria-label="Navigation latérale"
      className={cn(
        "bg-bg border-border-strong fixed inset-y-0 left-0 z-40 hidden w-[var(--rail-w)] flex-col",
        "border-r",
        "transition-[width] duration-200 ease-[var(--ease-out-soft)] ",
        "md:flex lg:w-[var(--side-w)] lg:data-[collapsed=true]:w-[var(--rail-w)]",
      )}
    >
      {/* Identité : libellé étendu sur desktop, monogramme si réduit/tablette. */}
      <div className="border-border-strong flex h-16 shrink-0 items-center border-b px-3 md:h-14">
        <Link
          href={ROUTES.home}
          aria-label="Accueil"
          className="press flex h-11 w-full items-center justify-center"
        >
          <LogoMark className="size-7 shrink-0" />
          <span className="font-display text-fg ml-2 hidden truncate text-lg font-bold tracking-[-0.045em] lg:inline lg:data-[collapsed=true]:hidden">
            event
          </span>
        </Link>
      </div>

      <nav aria-label="Sections de l'application" className="min-h-0 flex-1 overflow-y-auto p-2 md:p-3">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(pathname, item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  title={item.label}
                  onPointerDown={() => haptic("light")}
                  className={cn(
                    "press relative flex min-h-11 items-center justify-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors duration-150",
                    "lg:justify-start",
                    active
                      ? "bg-primary-subtle text-primary-subtle-fg"
                      : "text-fg-muted hover:bg-bg-muted hover:text-fg",
                  )}
                >
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  <span className="hidden truncate lg:inline lg:data-[collapsed=true]:hidden">
                    {item.label}
                  </span>

                  {item.badge ? (
                    <span
                      aria-hidden="true"
                      className="bg-danger-solid absolute right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white lg:right-2 lg:top-2 lg:data-[collapsed=true]:top-2"
                    >
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Accès secondaires ancrés en bas du rail. */}
      <div className="border-border-strong flex flex-col gap-1 border-t p-2 md:p-3">
        <Link
          href={ROUTES.myBadge}
          aria-current={isActiveRoute(pathname, ROUTES.myBadge) ? "page" : undefined}
          title="Mon badge"
          className={cn(
            "press flex min-h-11 items-center justify-center gap-3 rounded-xl px-3 text-sm font-semibold",
            "lg:justify-start",
            isActiveRoute(pathname, ROUTES.myBadge)
              ? "bg-primary-subtle text-primary-subtle-fg"
              : "text-fg-muted hover:bg-bg-muted hover:text-fg",
          )}
        >
          <QrCode className="size-5 shrink-0" aria-hidden="true" />
          <span className="hidden truncate lg:inline lg:data-[collapsed=true]:hidden">Mon badge</span>
        </Link>
        <Link
          href="/reglages"
          aria-current={isActiveRoute(pathname, "/reglages") ? "page" : undefined}
          title="Réglages"
          className={cn(
            "press flex min-h-11 items-center justify-center gap-3 rounded-xl px-3 text-sm font-semibold",
            "lg:justify-start",
            isActiveRoute(pathname, "/reglages")
              ? "bg-primary-subtle text-primary-subtle-fg"
              : "text-fg-muted hover:bg-bg-muted hover:text-fg",
          )}
        >
          <Settings className="size-5 shrink-0" aria-hidden="true" />
          <span className="hidden truncate lg:inline lg:data-[collapsed=true]:hidden">Réglages</span>
        </Link>
      </div>
    </aside>
  );
}
