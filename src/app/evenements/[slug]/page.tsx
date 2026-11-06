import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { UnifiedEventHero } from "@/components/events/unified-event-hero";
import { EventProgram, EventSpeakers } from "@/components/events/event-program";
import { SalonTeaser, TicketPicker } from "@/components/events/event-ticketing";
import { EditorialShell } from "@/components/layout/editorial/editorial-shell";
import { getPublishedEventBySlug } from "@/lib/events/queries";
import { getCategoryLabel } from "@/lib/constants";

import styles from "@/components/editorial/editorial.module.css";
import shell from "@/components/layout/editorial/editorial-shell.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublishedEventBySlug(slug).catch(() => null);
  if (!data) return { title: "Événement introuvable" };
  return {
    title: data.event.title,
    description: data.event.summary ?? `Participe à ${data.event.title} à ${data.event.city}.`,
  };
}

/* Page événement : affiche + informations + programme + billetterie. */

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublishedEventBySlug(slug).catch(() => null);
  if (!data) notFound();

  const { event, description, ticketTypes, sessions, speakers } = data;

  const heroEvent = {
    id: event.id,
    slug: event.slug,
    title: event.title,
    coverUrl: event.cover_url,
    categoryLabel: getCategoryLabel(event.category),
    city: event.city,
    venueName: event.venue_name,
    startAt: event.start_at,
    minPrice: event.min_price,
    maxPrice: event.max_price,
    firstTicketType: event.firstTicketType,
    summary: event.summary,
    endAt: event.end_at,
    gallery: event.gallery,
    organizerName: event.organizer_name,
    organizerVerified: event.organizer_verified,
    organizerLogoUrl: event.organizer_logo_url,
  };

  return (
    <EditorialShell>
      <div className={shell.wrap}>
        <nav aria-label="Fil d’Ariane" className={shell.crumb} style={{ paddingTop: 18 }}>
          <Link href="/explorer">Explorer</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{event.title}</span>
        </nav>

        <div style={{ marginTop: 22 }}>
          <UnifiedEventHero
            mode="single"
            event={heroEvent}
            showPracticalInfo={true}
          />
        </div>

        <div className={styles.eventLayout} style={{ marginTop: 34, paddingBottom: 40 }}>
          <div>

            <details className={styles.details}>
              <summary className={styles.detailsSummary}>
                <span className={styles.detailsTitle}>Détails de l’événement</span>
                <span className={styles.detailsHint}>
                  Description, programme et intervenants
                </span>
                <ChevronDown className={styles.detailsChevron} aria-hidden="true" />
              </summary>

              <div className={styles.detailsBody}>
                {description ? (
                  <section aria-labelledby="apropos" className={styles.block}>
                    <h2 id="apropos" className={styles.blockTitle}>
                      À propos
                    </h2>
                    <p className={styles.blockText}>{description}</p>
                  </section>
                ) : null}

                <EventProgram sessions={sessions} />
                <EventSpeakers speakers={speakers} />
                <SalonTeaser slug={event.slug} privacy={event.salon_privacy} />
              </div>
            </details>
          </div>

          <aside className={styles.aside}>
            <TicketPicker ticketTypes={ticketTypes} slug={event.slug} />
          </aside>
        </div>
      </div>
    </EditorialShell>
  );
}
