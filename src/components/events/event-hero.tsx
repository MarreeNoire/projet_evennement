import Image from "next/image";
import { CalendarDays, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { getCategoryLabel } from "@/lib/constants";
import { formatDateRange } from "@/lib/utils";
import type { PublishedEventView } from "@/types/database";

import { priceLabel } from "./event-card";

/* Couverture + infos clés d'un événement (haut de la page détail). */

export function EventHero({ event }: { event: PublishedEventView }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-surface">
      <div className="relative aspect-21/9 bg-bg-muted">
        {event.cover_url ? (
          <Image src={event.cover_url} alt="" fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div
            aria-hidden="true"
            className="flex size-full items-center justify-center bg-gradient-to-br from-brand-600 via-brand-800 to-ink-900"
          >
            <span className="font-display text-6xl font-bold text-white/80">
              {event.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute top-4 left-4 flex gap-1.5">
          <Badge variant="overlay">{getCategoryLabel(event.category)}</Badge>
          <Badge variant="overlay">{priceLabel(event)}</Badge>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-6 md:p-8">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-2xl font-bold leading-tight md:text-3xl">
            {event.title}
          </h1>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-fg-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden="true" />
              {formatDateRange(event.start_at, event.end_at)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden="true" />
              {event.venue_name ? `${event.venue_name} · ` : ""}
              {event.city}, {event.country}
            </span>
          </div>
          <p className="flex items-center gap-2 text-sm">
            <Avatar src={event.organizer_logo_url} name={event.organizer_name} size="sm" />
            <span>
              Organisé par <strong>{event.organizer_name}</strong>
              {event.organizer_verified ? (
                <span className="ml-1.5 text-success" title="Organisateur vérifié">
                  ✓ vérifié
                </span>
              ) : null}
            </span>
          </p>
        </div>

        {event.summary ? (
          <p className="max-w-3xl text-[15px] leading-relaxed text-fg-muted">{event.summary}</p>
        ) : null}
      </div>
    </section>
  );
}
