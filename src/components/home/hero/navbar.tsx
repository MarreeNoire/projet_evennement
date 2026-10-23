"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Menu, ShoppingCart, X } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { APP_NAME } from "@/lib/constants";

type MainNavItem = {
  label: string;
  href: string;
  hasDot?: boolean;
};

const MAIN_NAV: MainNavItem[] = [
  { label: "Accueil", href: "/", hasDot: true },
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
    <div className="flex justify-center px-3 pt-4 sm:px-4 sm:pt-6">
      <div className="relative w-full max-w-[760px] rounded-full border border-neutral-200 bg-white py-2 pl-2 pr-2 shadow-sm">
        <div className="flex items-center">
          <Link
            href="/"
            aria-label={`${APP_NAME} — Accueil`}
            className="flex shrink-0 items-center gap-2"
          >
            <LogoMark className="h-7 w-7 bg-[#ef4d23] sm:h-8 sm:w-8" />
            <span className="text-[15px] leading-none font-semibold tracking-tight text-neutral-900 sm:text-base">
              {APP_NAME}
            </span>
          </Link>

          <nav
            aria-label="Navigation principale"
            className="ml-5 hidden items-center gap-5 text-[14px] md:flex xl:gap-6"
          >
            {MAIN_NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-1.5 font-medium text-neutral-900 hover:text-[#ef4d23]"
              >
                {item.label}
                {item.hasDot ? (
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-black" />
                ) : null}
              </Link>
            ))}

            <div className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={discoverOpen}
                onClick={() => setDiscoverOpen((value) => !value)}
                className="flex items-center gap-1 font-medium text-[#ef4d23]"
              >
                Découvrir
                <ChevronDown
                  aria-hidden="true"
                  className={discoverOpen ? "h-3.5 w-3.5 rotate-180" : "h-3.5 w-3.5"}
                />
              </button>

              {discoverOpen ? (
                <div
                  role="menu"
                  className="absolute top-full left-0 z-30 mt-3 w-56 rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg"
                >
                  {DISCOVER_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      onClick={() => setDiscoverOpen(false)}
                      className="block rounded-xl px-3 py-2 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 hover:text-[#ef4d23]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/mes-billets"
              aria-label="Mes billets"
              className="hidden h-9 w-9 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100 md:inline-flex"
            >
              <ShoppingCart aria-hidden="true" className="h-4 w-4" />
            </Link>

            <Link
              href="/explorer"
              className="inline-flex items-center gap-2 rounded-full bg-[#ef4d23] py-1 pl-4 pr-1 text-[13px] font-medium text-white hover:bg-[#d9411b] sm:gap-3 sm:text-[14px]"
            >
              <span className="whitespace-nowrap">Explorer</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 sm:h-7 sm:w-7">
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </span>
            </Link>

            <button
              type="button"
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileOpen}
              aria-controls="event-hero-mobile-menu"
              onClick={() => setMobileOpen((value) => !value)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-800 hover:bg-neutral-100 md:hidden"
            >
              {mobileOpen ? (
                <X aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Menu aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div
            id="event-hero-mobile-menu"
            className="absolute left-2 right-2 top-full z-20 mt-2 rounded-2xl border border-neutral-200 bg-white p-3 shadow-lg md:hidden"
          >
            <nav aria-label="Menu mobile" className="flex flex-col gap-1">
              {MAIN_NAV.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  <span className="flex items-center gap-2">
                    {item.label}
                    {item.hasDot ? (
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-black" />
                    ) : null}
                  </span>
                </Link>
              ))}

              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">
                Découvrir
              </p>
              {DISCOVER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href="/connexion"
                onClick={() => setMobileOpen(false)}
                className="mt-2 border-t border-neutral-100 px-3 pt-3 text-sm font-semibold text-[#ef4d23]"
              >
                Connexion
              </Link>
            </nav>
          </div>
        ) : null}
      </div>
    </div>
  );
}
