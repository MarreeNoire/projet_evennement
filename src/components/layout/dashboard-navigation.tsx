"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Flag,
  LayoutDashboard,
  Megaphone,
  QrCode,
  ScrollText,
  Settings,
  Ticket,
  UserCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { haptic } from "@/lib/ui/haptics";
import { cn } from "@/lib/utils";

import styles from "./mobile-chrome.module.css";

export type DashboardNavigationItem = {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
};

const ADMIN_NAVIGATION_ITEMS: DashboardNavigationItem[] = [
  { href: "/admin", label: "Vue d’ensemble", icon: LayoutDashboard },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/admin/evenements", label: "Événements", icon: Calendar },
  {
    href: "/admin/paiements",
    label: "Paiements & commissions",
    mobileLabel: "Paiements",
    icon: Wallet,
  },
  { href: "/admin/moderation", label: "Signalements", icon: Flag },
  {
    href: "/admin/parametres",
    label: "Paramètres plateforme",
    mobileLabel: "Paramètres",
    icon: Settings,
  },
  {
    href: "/admin/journal",
    label: "Journal d’audit",
    mobileLabel: "Journal",
    icon: ScrollText,
  },
];

const ORGANIZER_NAVIGATION_ITEMS: DashboardNavigationItem[] = [
  { href: "/org", label: "Vue d’ensemble", icon: LayoutDashboard },
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

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNavigation({
  variant,
  title,
  description,
  profileName,
  returnLabel,
}: {
  variant: "admin" | "organizer";
  title: string;
  description: string;
  profileName?: string;
  returnLabel: string;
}) {
  const items = variant === "admin" ? ADMIN_NAVIGATION_ITEMS : ORGANIZER_NAVIGATION_ITEMS;
  const SectionIcon = variant === "admin" ? LayoutDashboard : Calendar;
  const pathname = usePathname();
  const activeMobileLinkRef = useRef<HTMLAnchorElement>(null);
  const current =
    [...items].sort((left, right) => right.href.length - left.href.length).find((item) =>
      isActive(pathname, item.href),
    ) ?? items[0]!;

  useEffect(() => {
    activeMobileLinkRef.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "instant",
    });
  }, [current.href]);

  return (
    <>
      <aside className="hidden min-w-0 lg:block">
        <div className="border-border bg-surface rounded-md border p-4">
          <div className="border-border-strong mb-3 flex min-w-0 items-center gap-3 border-b pb-3">
            <span className="bg-primary-subtle text-primary flex size-10 shrink-0 items-center justify-center rounded-sm">
              <SectionIcon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-fg text-sm font-bold">{title}</p>
              <p className="text-fg-muted truncate text-xs">{profileName || description}</p>
            </div>
          </div>

          <nav aria-label={`Navigation ${title.toLocaleLowerCase("fr-FR")}`}>
            <ul className="flex min-w-0 flex-col gap-1">
              {items.map(({ href, label, icon: Icon }) => {
                const active = current.href === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 min-w-0 items-center gap-3 border-l px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "border-primary bg-primary-subtle text-primary-subtle-fg"
                          : "text-fg-muted hover:bg-bg-muted hover:text-fg border-transparent",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 leading-tight">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-border mt-4 border-t pt-4">
            <Link
              href="/"
              className="text-fg-subtle hover:text-fg flex min-h-9 items-center gap-2 text-xs font-medium"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              {returnLabel}
            </Link>
          </div>
        </div>
      </aside>

      <nav
        aria-label={`Navigation ${title.toLocaleLowerCase("fr-FR")}`}
        className={cn(styles.tabbar, styles.dashboardTabbar, "dashboard-mobile-tabbar lg:hidden")}
      >
        <ul className={styles.dashboardList}>
          {items.map(({ href, label, mobileLabel, icon: Icon }) => {
            const active = current.href === href;
            return (
              <li key={href} className={styles.dashboardItem}>
                <Link
                  href={href}
                  ref={active ? activeMobileLinkRef : undefined}
                  aria-current={active ? "page" : undefined}
                  onPointerDown={() => haptic("light")}
                  className={styles.tab}
                >
                  <span className={styles.iconWrap}>
                    <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className={styles.label}>{mobileLabel ?? label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
