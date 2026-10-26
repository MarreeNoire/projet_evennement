"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  LogOut,
  Moon,
  Search,
  Sun,
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
  cta = { label: "Publier un événement", href: "/devenir-organisateur" },
  showCta = true,
}: {
  viewer: HeaderUser | null;
  nav?: EditorialNavItem[];
  cta?: { label: string; href: string };
  showCta?: boolean;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
            <Link href={ROUTES.explore} className={cx("icon-btn", "search-btn")} aria-label="Rechercher un événement">
              <Search className={cx("icon")} aria-hidden="true" />
            </Link>
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
          </div>
        </div>
      </header>
    </>
  );
}
