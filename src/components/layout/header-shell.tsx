"use client";

import { Bell, LoaderCircle, Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useOptimistic, useState, useTransition } from "react";

import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import type { HeaderUser } from "./header-types";
import { MobileNav } from "./mobile-nav";
import { getNavItems } from "./nav-config";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

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
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navigatingFromPath, setNavigatingFromPath] = useState<string | null>(null);
  const navigating = navigatingFromPath === pathname;
  const [currentUnreadCount, updateUnreadCount] = useOptimistic(
    unreadCount,
    (count, change: number) => Math.max(0, count + change),
  );
  const [, startTransition] = useTransition();
  const navItems = getNavItems(user);

  useEffect(() => {
    if (!user?.id) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`notification-count:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => startTransition(() => {
          updateUnreadCount(1);
          router.refresh();
        }),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const oldRow = payload.old as { is_read?: boolean };
          const newRow = payload.new as { is_read?: boolean };
          const change = oldRow.is_read === false && newRow.is_read === true
            ? -1
            : oldRow.is_read === true && newRow.is_read === false
              ? 1
              : 0;
          if (change) {
            startTransition(() => {
              updateUnreadCount(change);
              router.refresh();
            });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [pathname, router, updateUnreadCount, user?.id]);

  useEffect(() => {
    let resetTimer: ReturnType<typeof setTimeout> | undefined;
    const startNavigationFeedback = () => {
      setNavigatingFromPath(window.location.pathname);
      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => setNavigatingFromPath(null), 8000);
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target || link.hasAttribute("download")) return;

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search
      )
        return;

      startNavigationFeedback();
    };

    const handleFormSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.method.toLowerCase() !== "get" || form.target)
        return;
      if (!form.hasAttribute("action")) return;

      const destination = new URL(form.action, window.location.href);
      if (destination.origin === window.location.origin) startNavigationFeedback();
    };

    document.addEventListener("click", handleDocumentClick, true);
    document.addEventListener("submit", handleFormSubmit, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      document.removeEventListener("submit", handleFormSubmit, true);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, []);

  return (
    <header className="border-border-strong bg-surface sticky top-0 z-40 border-b">
      {navigating ? (
        <>
          <div aria-hidden="true" className="navigation-progress-track">
            <span className="navigation-progress-indicator" />
          </div>
          <div
            role="status"
            aria-live="polite"
            className="border-border bg-surface text-primary fixed top-20 right-3 z-[60] inline-flex size-11 items-center justify-center border shadow-sm sm:right-4"
          >
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            <span className="sr-only">Chargement de la page</span>
          </div>
        </>
      ) : null}
      <div className="container-page flex h-[4.5rem] items-center gap-4">
        <Link href={ROUTES.home} className="shrink-0" aria-label="Accueil">
          <Logo />
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-semibold transition-colors duration-150",
                  active
                    ? "border-primary text-primary"
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
                className="text-fg-subtle pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                id="header-search"
                name="q"
                type="search"
                placeholder="Rechercher des événements, salons…"
                className="border-border bg-bg placeholder:text-fg-subtle focus:border-border-focus focus:bg-surface h-10 w-48 rounded-sm border pr-4 pl-9 text-sm transition-[width] duration-200 focus:w-64 focus:outline-none"
              />
            </div>
          </form>

          <ThemeToggle className="hidden sm:inline-flex md:hidden lg:inline-flex" />

          {user ? (
            <>
              <Link
                href={ROUTES.notifications}
                className="text-fg-muted hover:border-border hover:bg-bg-muted hover:text-fg relative inline-flex size-10 items-center justify-center rounded-sm border border-transparent"
                aria-label={
                  currentUnreadCount > 0
                    ? `Notifications, ${currentUnreadCount} non lue${currentUnreadCount > 1 ? "s" : ""}`
                    : "Notifications"
                }
              >
                <Bell className="size-5" aria-hidden="true" />
                {currentUnreadCount > 0 ? (
                  <span
                    aria-hidden="true"
                    className="bg-danger-solid text-2xs ring-bg absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-sm px-1 font-bold text-white ring-2"
                  >
                    {currentUnreadCount > 99 ? "99+" : currentUnreadCount}
                  </span>
                ) : null}
              </Link>

              <div className="hidden md:block">
                <UserMenu user={user} />
              </div>
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
              <ButtonLink href={ROUTES.register} size="sm" className="hidden sm:inline-flex">
                Créer un compte
              </ButtonLink>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-fg-muted hover:border-border hover:bg-bg-muted inline-flex size-10 items-center justify-center rounded-sm border border-transparent lg:hidden"
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
          unreadCount={currentUnreadCount}
        />
      </div>
    </header>
  );
}
