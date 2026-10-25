"use client";

import { ArrowLeft, Bell, LoaderCircle, PanelLeft, Search, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useOptimistic, useState, useTransition } from "react";

import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ButtonLink } from "@/components/ui/button";
import { SearchBar } from "@/components/layout/search-bar";
import { ROUTES } from "@/lib/constants";
import { haptic } from "@/lib/ui/haptics";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import type { HeaderUser } from "./header-types";
import { getMobileHeaderTitle, useSideCollapsed } from "./app-nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

/* =============================================================================
   Barre supérieure adaptative
   --------------------------------------------------------------------------
   - Mobile (<768)  : 64 px, app native — bouton retour contextuel sur les
     pages de détail, icônes recherche/notification/avatar, aucun menu
     hamburger (la navigation vit dans la barre d'onglets du bas).
   - Tablette (768+) : recherche inline, rail latéral à icônes.
   - Desktop (≥1024) : recherche inline, barre latérale réductible, menu
     profil. Raccourci « / » pour la recherche, Échap pour fermer.

   Conservés à l'identique : indicateur de progression de navigation, badge
   temps réel des notifications (Supabase realtime), menu utilisateur.
   ========================================================================== */

export function HeaderShell({
  user,
  unreadCount = 0,
}: {
  user: HeaderUser | null;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sideCollapsed, setSideCollapsed] = useSideCollapsed();
  const [navigatingFromPath, setNavigatingFromPath] = useState<string | null>(null);
  const navigating = navigatingFromPath === pathname;
  const [currentUnreadCount, updateUnreadCount] = useOptimistic(
    unreadCount,
    (count, change: number) => Math.max(0, count + change),
  );
  const [, startTransition] = useTransition();
  const mobileTitle = getMobileHeaderTitle(pathname);
  /* /org et /admin n'affichent pas le rail latéral global : la marque doit
     rester visible dans la barre, même sur grand écran. */
  const hasSideRail = !pathname.startsWith("/org") && !pathname.startsWith("/admin");

  /* Temps réel : badge de notifications (logique inchangée). */
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
        () =>
          startTransition(() => {
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
          const change =
            oldRow.is_read === false && newRow.is_read === true
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

  /* Indicateur de progression de navigation (logique inchangée). */
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

  /* Raccourci « / » de recherche (le pli persistant est géré par le store). */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/") return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      const input = document.querySelector<HTMLInputElement>("[data-search-input]");
      if (input) {
        input.focus();
      } else {
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleSide = () => {
    haptic("light");
    setSideCollapsed(!sideCollapsed);
  };

  const goBack = () => {
    haptic("light");
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    if (mobileTitle) router.push(mobileTitle.backTo);
  };

  return (
    <header className="site-header bg-bg/92 border-border-strong sticky top-0 z-40 border-b shadow-md backdrop-blur-md md:bg-bg md:supports-[backdrop-filter]:bg-bg/80">
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

      <div className="container-page flex h-16 items-center gap-1.5 md:h-14 md:gap-2">
        {/* Retour natif, uniquement sur les pages de détail (mobile). */}
        {mobileTitle ? (
          <>
            <button
              type="button"
              onClick={goBack}
              aria-label="Retour"
              onPointerDown={() => haptic("light")}
              className="press text-fg inline-flex size-11 shrink-0 items-center justify-center rounded-xl md:hidden"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
            </button>
            <span className="font-display min-w-0 flex-none truncate text-base font-bold tracking-tight md:hidden">
              {mobileTitle.label}
            </span>
          </>
        ) : null}

        <button
          type="button"
          onClick={toggleSide}
          aria-label={sideCollapsed ? "Étendre la barre latérale" : "Réduire la barre latérale"}
          aria-pressed={sideCollapsed}
          className="press text-fg-muted hover:bg-bg-muted hover:text-fg hidden size-11 shrink-0 items-center justify-center rounded-xl lg:inline-flex"
        >
          <PanelLeft className="size-5" aria-hidden="true" />
        </button>

        {/* Identité — le rail/sidebar porte déjà la marque dès 768 px ;
            en mode « détail » sur mobile, le titre la remplace. */}
        <Link
          href={ROUTES.home}
          aria-label="Accueil — Event"
          className={cn(
            "press shrink-0 rounded-xl",
            hasSideRail && "md:ml-0 md:hidden",
            mobileTitle && "hidden",
          )}
        >
          <Logo />
        </Link>

        <div className="min-w-0 flex-1" />
        <SearchBar className="hidden w-full max-w-88 md:block" />

        <div className="ml-auto flex items-center gap-1 md:gap-1.5">
          <button
            type="button"
            onClick={() => {
              haptic("light");
              setSearchOpen(true);
            }}
            aria-label="Rechercher un événement"
            className="press text-fg-muted hover:bg-bg-muted hover:text-fg inline-flex size-11 shrink-0 items-center justify-center rounded-xl md:hidden"
          >
            <Search className="size-5" aria-hidden="true" />
          </button>

          <ThemeToggle className="hidden md:inline-flex" />

          {user ? (
            <>
              <Link
                href={ROUTES.notifications}
                aria-label={
                  currentUnreadCount > 0
                    ? `Notifications, ${currentUnreadCount} non lue${currentUnreadCount > 1 ? "s" : ""}`
                    : "Notifications"
                }
                className="press text-fg-muted hover:bg-bg-muted hover:text-fg relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl"
              >
                <Bell className="size-5" aria-hidden="true" />
                {currentUnreadCount > 0 ? (
                  <span
                    aria-hidden="true"
                    className="bg-danger-solid ring-bg absolute top-1.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ring-2"
                  >
                    {currentUnreadCount > 9 ? "9+" : currentUnreadCount}
                  </span>
                ) : null}
              </Link>

              <div className="hidden lg:block">
                <UserMenu user={user} />
              </div>
              <Link href={ROUTES.profile} aria-label="Mon profil" className="press shrink-0 lg:hidden">
                <Avatar src={user.avatarUrl} name={user.displayName} size="md" />
              </Link>
            </>
          ) : (
            <>
              <div className="hidden items-center gap-2 md:flex">
                <ButtonLink href={ROUTES.login} variant="ghost">
                  Connexion
                </ButtonLink>
                <ButtonLink href={ROUTES.register}>Créer un compte</ButtonLink>
              </div>
              <Link
                href={ROUTES.login}
                aria-label="Connexion"
                className="press text-fg-muted hover:bg-bg-muted hover:text-fg inline-flex size-11 shrink-0 items-center justify-center rounded-xl md:hidden"
              >
                <UserIcon className="size-5" aria-hidden="true" />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Recherche en feuille basse, façon app native (mobile). */}
      <BottomSheet
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Rechercher"
        closeLabel="Fermer la recherche"
      >
        <SearchBar className="w-full" />
        <p className="text-fg-subtle mt-3 text-xs">
          Astuce : sur ordinateur, appuie sur {""}
          <kbd className="bg-bg-muted rounded px-1.5 py-0.5 font-mono text-xs">/</kbd> depuis
          n&apos;importe quelle page.
        </p>
      </BottomSheet>
    </header>
  );
}
