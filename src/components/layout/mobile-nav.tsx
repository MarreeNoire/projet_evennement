"use client";

import { Bell, LogOut, Plus, Settings, Shield, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Logo } from "@/components/brand/logo";
import { PwaInstallButton } from "@/components/layout/pwa-install-button";
import { ButtonLink } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import type { HeaderUser } from "./header-types";
import { FOOTER_SECTIONS, getNavGroups } from "./nav-config";
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

  const navGroups = getNavGroups(user);

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
      className="app-mobile-nav-enter bg-bg fixed inset-0 z-50 flex flex-col lg:hidden"
    >
      <div className="border-border flex h-16 shrink-0 items-center justify-between border-b px-4">
        <Logo />
        <button
          type="button"
          onClick={onClose}
          className="border-border text-fg-muted hover:bg-bg-muted inline-flex size-10 items-center justify-center rounded-sm border"
        >
          <X className="size-5" aria-hidden="true" />
          <span className="sr-only">Fermer le menu</span>
        </button>
      </div>

      <nav aria-label="Navigation mobile" className="flex-1 overflow-y-auto p-4">
        {user?.isAdmin ? (
          <Link
            href={ROUTES.admin}
            aria-current={pathname.startsWith(ROUTES.admin) ? "page" : undefined}
            className="border-danger/40 bg-danger-subtle text-danger mb-4 flex min-h-14 items-center gap-3 rounded-xl border px-4 font-semibold shadow-sm"
          >
            <Shield className="size-5 shrink-0" aria-hidden="true" />
            <span className="flex-1">Espace administrateur</span>
            <span aria-hidden="true">→</span>
          </Link>
        ) : null}
        <form action={ROUTES.explore} method="get" role="search" className="mb-4">
          <label htmlFor="mobile-search" className="sr-only">
            Rechercher un événement
          </label>
          <input
            id="mobile-search"
            name="q"
            type="search"
            placeholder="Rechercher un événement…"
            className="border-border-strong bg-surface placeholder:text-fg-subtle focus:border-border-focus h-12 w-full rounded-sm border px-4 text-base focus:outline-none"
          />
        </form>

        <div className="flex flex-col gap-5">
          {user ? (
            <Link
              href={ROUTES.home}
              aria-current={pathname === "/" ? "page" : undefined}
              className={cn(
                "flex h-12 items-center px-4 text-base font-semibold",
                pathname === "/"
                  ? "bg-primary-subtle text-primary-subtle-fg"
                  : "text-fg hover:bg-bg-muted",
              )}
            >
              Accueil
            </Link>
          ) : null}
          {navGroups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h2 className="text-fg-subtle mb-1 px-3 py-1 text-xs font-semibold tracking-wide">
                {group.label}
              </h2>
              <ul className="flex flex-col">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex min-h-11 items-center rounded-lg px-3 text-base font-medium",
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
            </section>
          ))}
        </div>

        <details className="border-border mt-4 border-t pt-3">
          <summary className="text-fg flex min-h-11 cursor-pointer items-center px-3 text-sm font-semibold">
            À propos, aide et informations légales
          </summary>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 px-3 pt-1 pb-2">
            {FOOTER_SECTIONS.map((section) => (
              <section key={section.title} aria-label={section.title}>
                <h2 className="text-fg-subtle mb-1 text-xs font-semibold tracking-wide uppercase">
                  {section.title}
                </h2>
                <ul className="flex flex-col gap-1">
                  {section.links.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-fg-muted hover:text-primary inline-flex min-h-9 items-center text-xs underline-offset-4 hover:underline"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </details>

        {user ? (
          <div className="border-border mt-4 flex flex-col gap-1 border-t pt-4">
            <Link
              href={`${ROUTES.orgDashboard}/evenements/nouveau`}
              className="text-fg hover:bg-bg-muted flex h-12 items-center gap-3 rounded-xl px-4 text-base font-medium"
            >
              <Plus className="size-5" aria-hidden="true" />
              Créer un événement
            </Link>
            <Link
              href={ROUTES.notifications}
              className="text-fg hover:bg-bg-muted flex h-12 items-center gap-3 rounded-xl px-4 text-base font-medium"
            >
              <Bell className="size-5" aria-hidden="true" />
              Notifications
              {unreadCount > 0 ? (
                <span className="bg-danger-solid text-2xs ml-auto rounded-sm px-2 py-0.5 font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>
            <Link
              href={ROUTES.settings}
              className="text-fg hover:bg-bg-muted flex h-12 items-center gap-3 rounded-xl px-4 text-base font-medium"
            >
              <Settings className="size-5" aria-hidden="true" />
              Réglages
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-fg hover:bg-bg-muted flex h-12 items-center gap-3 rounded-xl px-4 text-left text-base font-medium"
            >
              <LogOut className="size-5" aria-hidden="true" />
              Se déconnecter
            </button>
          </div>
        ) : (
          <div className="border-border mt-4 flex flex-col gap-2 border-t pt-4">
            <ButtonLink href={ROUTES.login} variant="secondary" fullWidth>
              Connexion
            </ButtonLink>
            <ButtonLink href={ROUTES.register} fullWidth>
              Créer un compte
            </ButtonLink>
          </div>
        )}
      </nav>

      <div className="border-border shrink-0 border-t p-4">
        <div className="flex flex-col gap-4">
          <PwaInstallButton />
          <div className="flex items-center justify-between gap-3">
            <span className="text-fg text-sm font-medium">Apparence</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
