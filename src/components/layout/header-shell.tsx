"use client";

import { Bell, Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

import type { HeaderUser } from "./header-types";
import { MobileNav } from "./mobile-nav";
import { APP_NAV, PUBLIC_NAV } from "./nav-config";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

/* =============================================================================
   En-tête de l'application
   --------------------------------------------------------------------------
   * barre collante avec fond translucide ;
   * navigation de bureau, recherche rapide, notifications, menu du compte ;
   * menu mobile plein écran délégué à `MobileNav`.
   ========================================================================== */

function isActive(pathname: string, href: string): boolean {
  if (href === ROUTES.home) return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderShell({
  user,
  unreadCount = 0,
}: {
  user: HeaderUser | null;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = user ? APP_NAV : PUBLIC_NAV;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href={ROUTES.home} className="shrink-0 rounded-md" aria-label="Accueil">
          <Logo />
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-primary-subtle text-primary-subtle-fg"
                    : "text-fg-muted hover:bg-bg-muted hover:text-fg",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <form
            action={ROUTES.explore}
            method="get"
            role="search"
            className="hidden items-center md:flex"
          >
            <label htmlFor="header-search" className="sr-only">
              Rechercher un événement
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle"
                aria-hidden="true"
              />
              <input
                id="header-search"
                name="q"
                type="search"
                placeholder="Rechercher…"
                className="h-10 w-40 rounded-full border border-border bg-bg-muted pr-3 pl-9 text-sm transition-[width] duration-200 placeholder:text-fg-subtle focus:w-56 focus:border-border-focus focus:bg-surface focus:outline-none xl:w-52"
              />
            </div>
          </form>

          <ThemeToggle className="hidden sm:inline-flex md:hidden lg:inline-flex" />

          {user ? (
            <>
              <Link
                href={ROUTES.notifications}
                className="relative inline-flex size-10 items-center justify-center rounded-full text-fg-muted hover:bg-bg-muted hover:text-fg"
                aria-label={
                  unreadCount > 0
                    ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
                    : "Notifications"
                }
              >
                <Bell className="size-5" aria-hidden="true" />
                {unreadCount > 0 ? (
                  <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-danger-solid px-1 text-2xs font-bold text-white"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </Link>

              <UserMenu user={user} />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <ButtonLink
                href={ROUTES.login}
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                Connexion
              </ButtonLink>
              <ButtonLink href={ROUTES.register} size="sm">
                Créer un compte
              </ButtonLink>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex size-10 items-center justify-center rounded-full text-fg-muted hover:bg-bg-muted lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="menu-mobile"
          >
            <Menu className="size-5" aria-hidden="true" />
            <span className="sr-only">Ouvrir le menu</span>
          </button>
        </div>
      </div>

      <div id="menu-mobile">
        <MobileNav
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          user={user}
          unreadCount={unreadCount}
        />
      </div>
    </header>
  );
}