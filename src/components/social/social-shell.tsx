import type { ReactNode } from "react";

import { EditorialFooter } from "@/components/layout/editorial/editorial-footer";
import { EditorialScope } from "@/components/layout/editorial/editorial-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { loadHeaderUser } from "@/lib/auth/viewer";

/* =============================================================================
   Espace membre — coque de page
   --------------------------------------------------------------------------
   La navigation (mobile : barre d'onglets, tablette : rail, ordinateur :
   barre latérale) est rendue une seule fois par `SiteHeader`. `EditorialScope`
   applique la palette et la typographie éditoriales sans remplacer ce chrome
   applicatif : les fonctions (recherche, notifications, rail) restent intactes.
   ========================================================================== */

export type SocialSection =
  | "explorer"
  | "salons"
  | "billets"
  | "reseau"
  | "notifications"
  | "badge"
  | "profil";

export async function SocialShell({
  children,
}: {
  /** Section active conservée dans l'API (la barre latérale globale
      marque elle-même la page active). */
  active?: SocialSection;
  children: ReactNode;
}) {
  const viewer = await loadHeaderUser();

  return (
    <EditorialScope>
      <SiteHeader />

      <main
        id="contenu"
        className="container-page flex flex-1 flex-col gap-10 py-8 pb-24 lg:pb-14"
      >
        <div className="min-w-0">{children}</div>
      </main>

      <EditorialFooter viewer={viewer} />
    </EditorialScope>
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
