import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/* 404 événement : retour guidé vers l'explorer. */

export default function EventNotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex flex-col items-center gap-4 py-20 text-center">
        <p className="font-display text-5xl" aria-hidden="true">
          🎟️
        </p>
        <h1 className="font-display text-2xl font-bold">Événement introuvable</h1>
        <p className="max-w-md text-sm text-fg-muted">
          Cet événement n'existe pas, n'est plus publié ou le lien est incorrect.
        </p>
        <Link href="/explorer" className="text-sm font-medium text-primary hover:underline">
          Explorer les événements
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
