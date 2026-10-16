"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Menu, X, type LucideIcon } from "lucide-react";

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function DashboardMobileNavigation({
  items,
  title,
  homeLabel,
  accent,
}: {
  items: NavigationItem[];
  title: string;
  homeLabel: string;
  accent: "admin" | "org";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const current =
    items.find(({ href }) =>
      href === "/org" || href === "/admin"
        ? pathname === href
        : pathname === href || pathname.startsWith(`${href}/`),
    ) ?? items[0]!;
  const CurrentIcon = current.icon;
  const navLabel = `Navigation ${title.toLocaleLowerCase("fr-FR")}`;
  const activeClasses = "border-primary/50 bg-primary-subtle text-primary-subtle-fg rounded-md";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <div className="flex items-center gap-3 lg:hidden">
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="dashboard-mobile-navigation-dialog"
          onClick={() => setOpen(true)}
          className="border-border bg-bg-subtle text-fg hover:bg-bg-muted focus-visible:outline-border-focus inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Menu className="size-4" aria-hidden="true" />
          Menu
        </button>
        <div
          className="text-fg flex min-w-0 items-center gap-2 text-sm font-semibold"
          aria-live="polite"
        >
          <CurrentIcon className="text-primary size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{current.label}</span>
        </div>
      </div>

      <dialog
        id="dashboard-mobile-navigation-dialog"
        ref={dialogRef}
        data-dashboard={accent}
        aria-label={navLabel}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        className="text-fg fixed inset-0 z-50 m-0 h-dvh w-screen max-w-none border-0 bg-transparent p-0 backdrop:bg-black/50"
      >
        <section className="dashboard-menu-panel border-border bg-surface-raised/95 flex h-full w-[min(21rem,calc(100vw-2.5rem))] flex-col border-r shadow-xl backdrop-blur-xl">
          <header className="border-border flex min-h-16 items-center justify-between gap-3 border-b px-4">
            <div className="min-w-0">
              <h2 className="font-display truncate text-lg font-bold">{title}</h2>
              <p className="text-fg-muted truncate text-xs">{current.label}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
              className="border-border text-fg-muted hover:bg-bg-muted hover:text-fg focus-visible:outline-border-focus inline-flex size-11 shrink-0 items-center justify-center rounded-md border focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </header>

          <nav aria-label={navLabel} className="flex-1 overflow-y-auto p-3">
            <ul className="flex flex-col gap-1">
              {items.map(({ href, label, icon: Icon }) => {
                const active = current.href === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`focus-visible:outline-border-focus flex min-h-12 items-center gap-3 border-l px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] ${
                        active
                          ? activeClasses
                          : "text-fg-muted hover:bg-bg-muted hover:text-fg rounded-md border-transparent"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1">{label}</span>
                      {active ? <span className="sr-only">Section actuelle</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <footer className="border-border border-t p-3">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="text-fg-muted hover:bg-bg-muted hover:text-fg focus-visible:outline-border-focus flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {homeLabel}
            </Link>
          </footer>
        </section>
      </dialog>
    </>
  );
}
