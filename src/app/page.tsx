import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { EventGrid } from "@/components/events/event-card";
import { HowItWorks } from "@/components/home/how-it-works";
import { HomeHero } from "@/components/home/home-hero";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { EmptyState } from "@/components/ui/states";
import { ButtonLink } from "@/components/ui/button";
import { getFeaturedEvents } from "@/lib/events/queries";

/* Accueil : hero + catégories + événements à venir. */

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof getFeaturedEvents>> = [];
  let loadError = false;

  try {
    featured = await getFeaturedEvents(6);
  } catch {
    loadError = true;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="flex flex-col">
        <HomeHero />
        <HowItWorks />
        <section className="container-page flex flex-col gap-6 pb-16" aria-labelledby="a-venir">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="a-venir" className="font-display text-xl font-bold md:text-2xl">
                Événements à venir
              </h2>
              <p className="mt-1 text-sm text-fg-muted">Les prochaines dates près de chez toi.</p>
            </div>
            <Link
              href="/explorer"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Tout explorer
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          {loadError ? (
            <EmptyState
              title="Événements momentanément indisponibles"
              description="La liste n'a pas pu être chargée. Réessaie dans un instant."
              action={<ButtonLink href="/explorer">Aller à l'explorer</ButtonLink>}
            />
          ) : featured.length === 0 ? (
            <EmptyState
              title="Aucun événement pour le moment"
              description="Sois le premier au courant : reviens bientôt ou deviens organisateur."
              action={<ButtonLink href="/devenir-organisateur">Devenir organisateur</ButtonLink>}
            />
          ) : (
            <EventGrid events={featured} />
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
