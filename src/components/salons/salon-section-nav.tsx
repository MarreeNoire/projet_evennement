"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SALON_TABS, type SalonTab } from "@/lib/constants";

const MOBILE_TABS: SalonTab[] = ["accueil", "fil"];

export function SalonSectionNav({ salonId, activeTab }: { salonId: string; activeTab: SalonTab }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const primaryTabs = SALON_TABS.filter((tab) => MOBILE_TABS.includes(tab.slug));
  const extraTabs = SALON_TABS.filter((tab) => !MOBILE_TABS.includes(tab.slug));
  const activeExtra = extraTabs.find((tab) => tab.slug === activeTab);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function tabLink(slug: SalonTab, label: string, active: boolean) {
    return (
      <Link
        key={slug}
        href={`/salons/${salonId}?tab=${slug}`}
        aria-current={active ? "page" : undefined}
        className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm font-semibold whitespace-nowrap transition-colors duration-150 ${
          active
            ? "bg-primary-solid text-primary-solid-fg shadow-sm"
            : "text-fg-muted hover:bg-bg-muted hover:text-fg"
        }`}
        onClick={() => setOpen(false)}
      >
        {label}
      </Link>
    );
  }

  return (
    <nav aria-label="Sections du salon" className="salon-section-nav min-w-0">
      <div className="salon-section-mobile flex min-w-0 items-center gap-1.5 md:hidden">
        {primaryTabs.map((tab) => tabLink(tab.slug, tab.label, activeTab === tab.slug))}

        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={open}
            aria-controls="salon-section-menu"
            aria-label={activeExtra ? `Autres sections — ${activeExtra.label}` : "Autres sections"}
            className={`inline-flex min-h-11 items-center gap-1 rounded-full border px-3 text-sm font-semibold transition-colors ${
              activeExtra
                ? "border-primary/40 bg-primary-subtle text-primary"
                : "border-border text-fg-muted hover:bg-bg-muted hover:text-fg"
            }`}
            onClick={() => setOpen((value) => !value)}
          >
            <span>{activeExtra?.label ?? "Plus"}</span>
            <ChevronDown
              aria-hidden="true"
              className={`size-4 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open ? (
            <div
              id="salon-section-menu"
              className="border-border bg-surface absolute top-full left-0 z-50 mt-2 w-56 rounded-2xl border p-2 shadow-xl"
            >
              <p className="text-fg-subtle px-2.5 py-2 text-[10px] font-bold tracking-[0.12em] uppercase">
                Autres sections
              </p>
              <ul className="flex flex-col gap-1">
                {extraTabs.map((tab) => (
                  <li key={tab.slug}>
                    {tabLink(tab.slug, tab.label, activeTab === tab.slug)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="salon-section-desktop hidden flex-wrap items-center gap-1.5 md:flex">
        {SALON_TABS.map((tab) => tabLink(tab.slug, tab.label, activeTab === tab.slug))}
      </div>
    </nav>
  );
}
