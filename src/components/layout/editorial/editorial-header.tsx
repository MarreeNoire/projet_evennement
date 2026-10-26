"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";

import { useTheme } from "@/components/providers/app-providers";
import type { HeaderUser } from "@/components/layout/header-types";
import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";

import { EDITORIAL_NAV, type EditorialNavItem } from "./editorial-nav";
import styles from "./editorial-shell.module.css";

/* =============================================================================
   En-tête éditorial public
   --------------------------------------------------------------------------
   Même en-tête sur tout le parcours public : accueil, explorer, fiche
   événement, organisateurs, aide, pages légales.

   * `aria-current="page"` sur le lien actif ;
   * menu du compte fermé au clic extérieur, à Échap, avec retour du focus ;
   * menu mobile en plein écran, focus piégé, fermé à Échap ;
   * thème clair/sombre partagé avec le reste de l'application.
   ========================================================================== */

function cx(...names: Array<string | false | null | undefined>) {
  return names
    .filter(Boolean)
    .map((name) => styles[name as string])
    .join(" ");
}

function Brand() {
  return (
    <>
      <span className={cx("brand-mark")} aria-hidden="true">
        e
      </span>
      <span className={cx("brand-word")}>event</span>
      <span className={cx("brand-dot")} aria-hidden="true" />
    </>
  );
}

function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      className={cx("icon-btn", "theme-btn")}
      aria-label={isDark ? "Passer en thème clair" : "Passer en thème sombre"}
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Sun className={cx("icon", "icon-sun")} aria-hidden="true" />
      <Moon className={cx("icon", "icon-moon")} aria-hidden="true" />
    </button>
  );
}

function AccountMenu({ viewer }: { viewer: HeaderUser }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    if (isSupabaseConfigured) {
      await createSupabaseBrowserClient().auth.signOut();
    }
    setOpen(false);
    router.push(ROUTES.home);
    router.refresh();
  }

  return (
    <div ref={containerRef} className={cx("account")}>
      <button
        ref={buttonRef}
        type="button"
        className={cx("account-btn")}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className={cx("account-avatar")} aria-hidden="true">
          {viewer.avatarUrl ? (
            <PublicStorageImage
              src={viewer.avatarUrl}
              alt=""
              width={32}
              height={32}
              sizes="32px"
            />
          ) : (
            <span>{getInitials(viewer.displayName)}</span>
          )}
        </span>
        <span className={cx("account-name")}>{viewer.displayName}</span>
        <ChevronDown className={cx("icon", "account-chevron")} aria-hidden="true" />
        <span className="sr-only">Ouvrir le menu du compte</span>
      </button>

      {open ? (
        <div className={cx("account-menu")} role="menu">
          <div className={cx("account-meta")}>
            <p>{viewer.displayName}</p>
            {viewer.username ? <p>@{viewer.username}</p> : null}
          </div>

          <div className={cx("account-links")}>
            <Link role="menuitem" href={ROUTES.profile} onClick={() => setOpen(false)}>
              Mon profil
            </Link>
            <Link role="menuitem" href={ROUTES.myTickets} onClick={() => setOpen(false)}>
              Mes billets
            </Link>
            <Link role="menuitem" href={ROUTES.settings} onClick={() => setOpen(false)}>
              Réglages
            </Link>
            <Link role="menuitem" href={ROUTES.orgDashboard} onClick={() => setOpen(false)}>
              {viewer.isOrganizer ? "Espace organisateur" : "Devenir organisateur"}
            </Link>
            {viewer.isAdmin ? (
              <Link role="menuitem" href={ROUTES.admin} onClick={() => setOpen(false)}>
                Administration
              </Link>
            ) : null}
          </div>

          <button
            type="button"
            role="menuitem"
            className={cx("account-signout")}
            onClick={handleSignOut}
          >
            <LogOut className={cx("icon")} aria-hidden="true" />
            Se déconnecter
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function EditorialHeader({
  viewer,
  nav = EDITORIAL_NAV,
  menuId = "editorial-menu",
  cta = { label: "Publier un événement", href: "/devenir-organisateur" },
  showCta = true,
}: {
  viewer: HeaderUser | null;
  nav?: EditorialNavItem[];
  menuId?: string;
  cta?: { label: string; href: string };
  showCta?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  /* Chemin au moment de l'ouverture : un changement de page referme le menu
     sans effet ni état intermédiaire. */
  const [menuPath, setMenuPath] = useState(pathname);
  const mobileOpen = menuOpen && menuPath === pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    /* Le panneau devient visible au rendu suivant : on diffère le focus d'une
       frame pour qu'il soit accepté, y compris après la sortie de `inert`. */
    const frame = window.requestAnimationFrame(() => menuCloseRef.current?.focus());

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const openMenu = () => {
    setMenuPath(pathname);
    setMenuOpen(true);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key !== "Tab" || !menuRef.current) return;

    const focusable = menuRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await createSupabaseBrowserClient().auth.signOut();
    }
    setMenuOpen(false);
    router.push(ROUTES.home);
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === ROUTES.explore) return pathname.startsWith("/explorer") || pathname.startsWith("/evenements");
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <header className={cx("site-head", scrolled && "is-scrolled")} id="haut">
        <div className={cx("wrap", "head-inner")}>
          <Link href="/" className={cx("brand")} aria-label={`${APP_NAME} — Accueil`}>
            <Brand />
          </Link>

          <nav className={cx("main-nav")} aria-label="Navigation principale">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={cx("head-actions")}>
            {viewer ? (
              <AccountMenu viewer={viewer} />
            ) : (
              <Link href={ROUTES.login} className={cx("head-login")}>
                Connexion
              </Link>
            )}
            {showCta ? (
              <Link href={cta.href} className={cx("btn", "btn-outline", "btn-sm")}>
                {cta.label}
              </Link>
            ) : null}
            <ThemeButton />
            <button
              ref={menuButtonRef}
              type="button"
              className={cx("icon-btn", "menu-btn")}
              aria-label="Ouvrir le menu"
              aria-expanded={mobileOpen}
              aria-controls={menuId}
              onClick={openMenu}
            >
              <Menu className={cx("icon")} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div
        ref={menuRef}
        id={menuId}
        className={cx("mobile-menu", mobileOpen && "is-open")}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        onKeyDown={handleMenuKeyDown}
      >
        <div className={cx("mobile-menu-top")}>
          <Link href="/" className={cx("brand")} aria-label={`${APP_NAME} — Accueil`}>
            <Brand />
          </Link>
          <button
            ref={menuCloseRef}
            type="button"
            className={cx("icon-btn")}
            aria-label="Fermer le menu"
            onClick={closeMenu}
          >
            <X className={cx("icon")} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Menu principal">
          {nav.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={cx("mobile-menu-foot")}>
          <Link href={ROUTES.explore} className={cx("btn", "btn-primary")} onClick={closeMenu}>
            Découvrir les sorties
          </Link>
          {showCta ? (
            <Link href={cta.href} className={cx("btn", "btn-outline")} onClick={closeMenu}>
              {cta.label}
            </Link>
          ) : null}
          {viewer ? (
            <>
              <Link href={ROUTES.profile} className={cx("head-login")} onClick={closeMenu}>
                Mon profil
              </Link>
              <Link href={ROUTES.myTickets} className={cx("head-login")} onClick={closeMenu}>
                Mes billets
              </Link>
              <button
                type="button"
                className={cx("head-login", "head-signout")}
                onClick={() => void handleSignOut()}
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <Link href={ROUTES.login} className={cx("head-login")} onClick={closeMenu}>
              Connexion
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
