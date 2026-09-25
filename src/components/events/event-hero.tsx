import { Avatar } from "@/components/ui/avatar";
import { getCategoryLabel } from "@/lib/constants";
import { formatDateRange } from "@/lib/utils";
import type { PublishedEventView } from "@/types/database";

import { priceLabel } from "./event-card";

/* =============================================================================
   Couverture + infos clés d'un événement (haut de la page détail)
   --------------------------------------------------------------------------
   Mise en page d'affiche : visuel en bandeau, puis titre en grand à gauche et
   fiche pratique (date / lieu / organisateur) à droite, séparée par des filets.
   La grille reprend les proportions de la page (1.6fr / 1fr) pour que les
   colonnes s'alignent avec la billetterie plus bas.
   ========================================================================== */

export function EventHero({ event }: { event: PublishedEventView }) {
  const gallery = Array.isArray(event.gallery) ? event.gallery : [];
  const imageUrl = event.cover_url ?? gallery[0] ?? null;

  return (
    <section aria-labelledby="titre-evenement" className="flex flex-col gap-8">
      <div className="relative aspect-21/9 overflow-hidden rounded-lg bg-bg-muted">
        {imageUrl ? (
          // Les images Supabase sont servies directement pour éviter le proxy Next.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-fg-subtle">
            Aucune image
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:gap-6">
        <div className="flex min-w-0 flex-col gap-4">
          <p className="eyebrow">
            {getCategoryLabel(event.category)} · {priceLabel(event)}
          </p>
          <h1
            id="titre-evenement"
            className="font-display text-4xl leading-[1.02] font-semibold md:text-5xl lg:text-6xl"
          >
            {event.title}
          </h1>
          {event.summary ? (
            <p className="max-w-2xl text-base leading-relaxed text-fg-muted md:text-lg">
              {event.summary}
            </p>
          ) : null}
        </div>

        <dl className="flex flex-col self-start border-t border-border text-sm">
          <div className="flex flex-col gap-1 border-b border-border py-4">
            <dt className="eyebrow">Date</dt>
            <dd className="font-medium">{formatDateRange(event.start_at, event.end_at)}</dd>
          </div>
          <div className="flex flex-col gap-1 border-b border-border py-4">
            <dt className="eyebrow">Lieu</dt>
            <dd className="font-medium">
              {event.venue_name ? `${event.venue_name} · ` : ""}
              {event.city}, {event.country}
            </dd>
          </div>
          <div className="flex flex-col gap-2 border-b border-border py-4">
            <dt className="eyebrow">Organisé par</dt>
            <dd className="flex items-center gap-2.5 font-medium">
              <Avatar src={event.organizer_logo_url} name={event.organizer_name} size="sm" />
              <span>
                {event.organizer_name}
                {event.organizer_verified ? (
                  <span className="ml-2 text-xs font-semibold text-success" title="Organisateur vérifié">
                    ✓ vérifié
                  </span>
                ) : null}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
