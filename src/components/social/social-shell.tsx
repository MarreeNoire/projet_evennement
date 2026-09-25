import Link from "next/link";
import { Bell, Compass, MessageSquare, QrCode, Ticket, User, Users } from "lucide-react";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/layout/site-header";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* =============================================================================
   Espace membre — rail de navigation (ordinateur)
   --------------------------------------------------------------------------
   Sur mobile, la navigation principale vient du `BottomNav` global (rendu par
   `SiteHeader`) : on ne la duplique pas ici. Sur ordinateur, un rail vertical
   à gauche complète l'en-tête avec les sections propres à l'espace membre.
   ========================================================================== */

export type SocialSection =
  | "explorer"
  | "salons"
  | "billets"
  | "reseau"
  | "notifications"
  | "badge"
  | "profil";

const SECTIONS: { key: SocialSection; href: string; label: string; icon: typeof Compass }[] = [
  { key: "explorer", href: ROUTES.explore, label: "Explorer", icon: Compass },
  { key: "salons", href: ROUTES.mySalons, label: "Salons", icon: MessageSquare },
  { key: "billets", href: ROUTES.myTickets, label: "Billets", icon: Ticket },
  { key: "reseau", href: ROUTES.connections, label: "Réseau", icon: Users },
  { key: "notifications", href: ROUTES.notifications, label: "Alertes", icon: Bell },
  { key: "badge", href: ROUTES.myBadge, label: "Mon badge", icon: QrCode },
  { key: "profil", href: ROUTES.profile, label: "Profil", icon: User },
];

export function SocialShell({
  active,
  children,
}: {
  active: SocialSection;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main
        id="contenu"
        className="container-page grid flex-1 gap-10 py-8 pb-24 lg:grid-cols-[12rem_minmax(0,1fr)] lg:pb-14"
      >
        {/* Rail (ordinateur uniquement) */}
        <nav aria-label="Espace membre" className="hidden lg:block">
          <div className="sticky top-24">
            <p className="eyebrow mb-3">Mon espace</p>
            <ul className="flex flex-col">
              {SECTIONS.map(({ key, href, label, icon: Icon }) => {
                const isActive = key === active;
                return (
                  <li key={key}>
                    <Link
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 border-l-2 py-2.5 pl-4 text-[15px] transition-colors duration-150",
                        isActive
                          ? "border-primary font-semibold text-fg"
                          : "border-border font-medium text-fg-muted hover:border-border hover:text-fg",
                      )}
                    >
                      <Icon className="size-[18px]" aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="min-w-0">{children}</div>
      </main>
    </div>
  );
}

/* En-tête de page d'un espace membre : filet d'encre, rubrique, grand titre serif. */

export function SocialPageHeader({
  eyebrow,
  title,
  accent,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  /** Fin de titre mise en italique dans la couleur d'accent. */
  accent?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl leading-[1.02] font-semibold md:text-5xl">
          {title}
          {accent ? <span className="font-normal text-primary italic"> {accent}</span> : null}
        </h1>
        {description ? <p className="mt-3 text-sm text-fg-muted md:text-base">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
