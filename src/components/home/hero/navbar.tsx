"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";

import { APP_NAME } from "@/lib/constants";

type MainNavItem = {
  label: string;
  href: string;
};

const MAIN_NAV: MainNavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Événements", href: "/explorer" },
  { label: "Organisateurs", href: "/organisateurs" },
];

const DISCOVER_LINKS = [
  { label: "Centre d'aide", href: "/aide" },
  { label: "Devenir organisateur", href: "/devenir-organisateur" },
  { label: "Nous contacter", href: "/contact" },
];

export function EventHeroNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);

  return (
    <div className="home-nav">
      <Link href="/" aria-label={`${APP_NAME} — Accueil`} className="home-nav-brand">
        <span aria-hidden="true" className="home-nav-mark" />
        {APP_NAME}
      </Link>

      <nav aria-label="Navigation principale" className="home-nav-links">
        {MAIN_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.href === "/" ? "page" : undefined}
            className="home-nav-link"
          >
            {item.label}
          </Link>
        ))}

        <div className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={discoverOpen}
            onClick={() => setDiscoverOpen((value) => !value)}
            className="home-nav-link inline-flex items-center gap-1"
          >
            Découvrir
            <ChevronDown
              aria-hidden="true"
              className={`size-3.5 transition-transform duration-200 ${discoverOpen ? "rotate-180" : ""}`}
            />
          </button>

          {discoverOpen ? (
            <div role="menu" className="home-nav-sheet start-0 w-56">
              {DISCOVER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  onClick={() => setDiscoverOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </nav>

      <div className="home-nav-actions">
        <Link
          href="/connexion"
          className="hidden text-[0.85rem] font-semibold text-[rgba(244,242,236,0.85)] transition-colors hover:text-(--paper) md:inline-flex"
        >
          Connexion
        </Link>

        <Link href="/explorer" className="home-btn home-btn-primary min-h-9 px-3 text-[0.8rem]">
          Explorer
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </Link>

        <button
          type="button"
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={mobileOpen}
          aria-controls="event-hero-mobile-menu"
          onClick={() => setMobileOpen((value) => !value)}
          className="home-nav-menu flex size-9 items-center justify-center rounded-lg md:hidden"
        >
          {mobileOpen ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>

      {mobileOpen ? (
        <div id="event-hero-mobile-menu" className="home-nav-sheet md:hidden">
          <nav aria-label="Menu mobile" className="flex flex-col gap-0.5">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between"
              >
                {item.label}
              </Link>
            ))}

            <p className="home-nav-sheet-label">Découvrir</p>
            {DISCOVER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                {link.label}
              </Link>
            ))}

            <Link
              href="/connexion"
              onClick={() => setMobileOpen(false)}
              className="mt-1 border-t border-[rgba(244,242,236,0.16)] pt-2 text-(--mint)"
            >
              Connexion
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
