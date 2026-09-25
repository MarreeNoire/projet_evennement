"use client";

import { Bell, LogOut, Plus, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import type { HeaderUser } from "./header-types";
import { APP_NAV, PUBLIC_NAV, getNavItems } from "./nav-config";
import { ThemeToggle } from "./theme-toggle";

/* =============================================================================
   Menu de navigation mobile
   --------------------------------------------------------------------------
   Superposition plein écran plutôt qu'un tiroir latéral : sur les petits
   écrans, les cibles tactiles restent larges et le défilement est naturel.

   * `role="dialog"` + `aria-modal` pour isoler la navigation ;
   * défilement de l'arrière-plan bloqué tant que le menu est ouvert ;
   * fermeture immédiate au changement de page.
   ========================================================================== */

export function MobileNav({
  open,
  onClose,
  user,
  unreadCount = 0,
}: {
  open: boolean;
  onClose: () => void;
  user: HeaderUser | null;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Fermeture à chaque changement de page.
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open) return null;

  const navItems = getNavItems(user);

  async function handleSignOut() {
    if (isSupabaseConfigured) {
      await createSupabaseBrowserClient().auth.signOut();
    }
    onClose();
    router.push(ROUTES.home);
    router.refresh();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navigation"
      className="fixed inset-0 z-50 flex flex-col bg-bg lg:hidden"
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
        <Logo />
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-10 items-center justify-center rounded-full text-fg-muted hover:bg-bg-muted"
        >
          <X className="size-5" aria-hidden="true" />
          <span className="sr-only">Fermer le menu</span>
        </button>
      </div>

      <nav aria-label="Navigation mobile" className="flex-1 overflow-y-auto p-4">
        <form action={ROUTES.explore} method="get" role="search" className="mb-4">
          <label htmlFor="mobile-search" className="sr-only">
            Rechercher un événement
          </label>
          <input
            id="mobile-search"
            name="q"
            type="search"
            placeholder="Rechercher un événement…"
            className="h-12 w-full rounded-xl border border-border bg-bg-muted px-4 text-base placeholder:text-fg-subtle focus:border-border-focus focus:bg-surface focus:outline-none"
          />
        </form>

        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active =
              item.href === ROUTES.home
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-12 items-center rounded-xl px-4 text-base font-medium",
                    active
                      ? "bg-primary-subtle text-primary-subtle-fg"
                      : "text-fg hover:bg-bg-muted",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {user ? (
          <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4">
            <Link
              href={`${ROUTES.orgDashboard}/evenements/nouveau`}
              className="flex h-12 items-center gap-3 rounded-xl px-4 text-base font-medium text-fg hover:bg-bg-muted"
            >
              <Plus className="size-5" aria-hidden="true" />
              Créer un événement
            </Link>
            <Link
              href={ROUTES.notifications}
              className="flex h-12 items-center gap-3 rounded-xl px-4 text-base font-medium text-fg hover:bg-bg-muted"
            >
              <Bell className="size-5" aria-hidden="true" />
              Notifications
              {unreadCount > 0 ? (
                <span className="ml-auto rounded-full bg-danger-solid px-2 py-0.5 text-2xs font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>
            <Link
              href={ROUTES.settings}
              className="flex h-12 items-center gap-3 rounded-xl px-4 text-base font-medium text-fg hover:bg-bg-muted"
            >
              <Settings className="size-5" aria-hidden="true" />
              Réglages
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex h-12 items-center gap-3 rounded-xl px-4 text-left text-base font-medium text-fg hover:bg-bg-muted"
            >
              <LogOut className="size-5" aria-hidden="true" />
              Se déconnecter
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
            <ButtonLink href={ROUTES.login} variant="secondary" fullWidth>
              Connexion
            </ButtonLink>
            <ButtonLink href={ROUTES.register} fullWidth>
              Créer un compte
            </ButtonLink>
          </div>
        )}
      </nav>

      <div className="shrink-0 border-t border-border p-4">
        <ThemeToggle className="w-full justify-center" />
      </div>
    </div>
  );
}