import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/* 404 événement : retour guidé vers l'explorer. */

export default function EventNotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex flex-col items-start gap-4 py-20">
        <p className="eyebrow">Erreur 404</p>
        <h1 className="font-display text-5xl leading-[1.02] font-semibold md:text-7xl">
          Événement <span className="font-normal text-primary italic">introuvable.</span>
        </h1>
        <p className="max-w-md text-sm text-fg-muted">
          Cet événement n'existe pas, n'est plus publié ou le lien est incorrect.
        </p>
        <Link
          href="/explorer"
          className="text-sm font-semibold text-primary underline underline-offset-4 hover:decoration-2"
        >
          Explorer les événements
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
