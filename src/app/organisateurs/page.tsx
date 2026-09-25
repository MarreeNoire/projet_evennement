import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { getPublicOrganizers, type PublicOrganizer } from "@/lib/events/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Organisateurs",
  description: "Les organisateurs qui publient des événements à venir sur la plateforme.",
};

/* =============================================================================
   Annuaire des organisateurs
   --------------------------------------------------------------------------
   Liste éditoriale (filets, pas de cartes) des organisateurs ayant au moins un
   événement à venir. Chaque ligne renvoie vers leur prochain événement.
   ========================================================================== */

export default async function OrganizersPage() {
  let organizers: PublicOrganizer[] = [];
  let loadError = false;

  try {
    organizers = await getPublicOrganizers();
  } catch {
    loadError = true;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex flex-col gap-10 py-10 md:py-14">
        <header className="grid gap-6 border-t border-border pt-4 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:gap-16">
          <div>
            <p className="eyebrow">Annuaire</p>
            <h1 className="mt-2 font-display text-4xl leading-[1.02] font-semibold md:text-6xl">
              Ceux qui <span className="font-normal text-primary italic">rassemblent.</span>
            </h1>
          </div>
          <p className="text-base leading-relaxed text-fg-muted">
            Les organisateurs qui ont un événement à venir. Ouvre leur prochaine date, réserve ta
            place et rejoins le salon de l&apos;événement.
          </p>
        </header>

        {loadError ? (
          <EmptyState
            title="Annuaire momentanément indisponible"
            description="La liste n'a pas pu être chargée. Réessaie dans un instant."
            action={<ButtonLink href="/explorer">Aller à l&apos;explorer</ButtonLink>}
          />
        ) : organizers.length === 0 ? (
          <EmptyState
            title="Aucun organisateur pour le moment"
            description="Dès qu'un événement est publié, son organisateur apparaît ici."
            action={<ButtonLink href="/devenir-organisateur">Devenir organisateur</ButtonLink>}
          />
        ) : (
          <ul className="flex flex-col border-t border-border">
            {organizers.map((organizer) => (
              <li
                key={organizer.id}
                className="grid gap-4 border-b border-border py-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] md:items-center md:gap-8"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <Avatar src={organizer.logoUrl} name={organizer.name} size="lg" />
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-2xl leading-tight font-semibold">
                      {organizer.name}
                    </h2>
                    <p className="mt-1 text-sm text-fg-muted">
                      {organizer.eventCount} événement{organizer.eventCount > 1 ? "s" : ""} à venir
                      {organizer.cities.length > 0 ? ` · ${organizer.cities.join(", ")}` : ""}
                    </p>
                    {organizer.verified ? (
                      <p className="mt-1 text-xs font-semibold text-success">✓ Organisateur vérifié</p>
                    ) : null}
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="eyebrow">Prochain événement</p>
                  <p className="mt-1 truncate text-sm font-medium">{organizer.nextEvent.title}</p>
                  <p className="text-xs text-fg-subtle">{formatDate(organizer.nextEvent.startAt)}</p>
                </div>

                <Link
                  href={`/evenements/${organizer.nextEvent.slug}`}
                  className="text-sm font-semibold text-primary underline underline-offset-4 hover:decoration-2 md:justify-self-end"
                  aria-label={`Voir l'événement ${organizer.nextEvent.title} de ${organizer.name}`}
                >
                  Voir l&apos;événement →
                </Link>
              </li>
            ))}
          </ul>
        )}

        <section
          aria-labelledby="rejoindre"
          className="flex flex-col gap-4 border-y border-border py-8 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="eyebrow">Tu organises ?</p>
            <h2 id="rejoindre" className="mt-2 font-display text-2xl font-semibold md:text-3xl">
              Ajoute ton événement à cet annuaire.
            </h2>
          </div>
          <ButtonLink href="/devenir-organisateur" size="lg" className="shrink-0">
            Devenir organisateur
          </ButtonLink>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
