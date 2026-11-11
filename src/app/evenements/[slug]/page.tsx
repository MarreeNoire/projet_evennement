import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";

import { EventInfoTabs } from "@/components/events/event-info-tabs";
import { UnifiedEventHero } from "@/components/events/unified-event-hero";
import { EventProgram, EventSpeakers } from "@/components/events/event-program";
import { SalonTeaser, TicketPicker } from "@/components/events/event-ticketing";
import { EditorialShell } from "@/components/layout/editorial/editorial-shell";
import { getPublishedEventBySlug } from "@/lib/events/queries";
import { getCategoryLabel } from "@/lib/constants";
import { formatDateRange } from "@/lib/utils";

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
          />
        </div>

        <EventInfoTabs
          tickets={
            <div className={styles.eventTicketPanel}>
              <TicketPicker ticketTypes={ticketTypes} slug={event.slug} />
            </div>
          }
          details={
            <div className={styles.eventDetailsPanel}>
              <section className={styles.eventPractical} aria-labelledby="event-practical-title">
                <header className={styles.eventPracticalHeader}>
                  <div>
                    <p className={styles.eventDetailsEyebrow}>À retenir</p>
                    <h2 id="event-practical-title" className={styles.eventPracticalTitle}>
                      Informations pratiques
                    </h2>
                  </div>
                  <span className={styles.eventPracticalHint}>Prépare ta venue</span>
                </header>

                <dl className={styles.eventPracticalGrid}>
                  <div className={styles.eventPracticalItem}>
                    <dt className={styles.eventPracticalLabel}>Date</dt>
                    <dd className={styles.eventPracticalValue}>
                      <CalendarDays aria-hidden="true" />
                      <span>{formatDateRange(event.start_at, event.end_at ?? event.start_at)}</span>
                    </dd>
                  </div>
                  <div className={styles.eventPracticalItem}>
                    <dt className={styles.eventPracticalLabel}>Lieu</dt>
                    <dd className={styles.eventPracticalValue}>
                      <MapPin aria-hidden="true" />
                      <span>
                        {event.venue_name ? `${event.venue_name} · ` : ""}
                        {event.city}
                      </span>
                    </dd>
                  </div>
                  <div className={styles.eventPracticalItem}>
                    <dt className={styles.eventPracticalLabel}>Organisé par</dt>
                    <dd className={styles.eventPracticalValue}>
                      <span>
                        {event.organizer_name}
                        {event.organizer_verified ? (
                          <span className={styles.eventVerified} title="Organisateur vérifié">
                            Vérifié
                          </span>
                        ) : null}
                      </span>
                    </dd>
                  </div>
                </dl>
              </section>

              {description ? (
                <section aria-labelledby="apropos" className={styles.eventAbout}>
                  <div>
                    <p className={styles.eventDetailsEyebrow}>Présentation</p>
                    <h2 id="apropos" className={styles.blockTitle}>
                      À propos de l’événement
                    </h2>
                  </div>
                  <p className={styles.blockText}>{description}</p>
                </section>
              ) : null}

              {sessions.length > 0 && speakers.length > 0 ? (
                <div className={styles.eventDetailsColumns}>
                  <EventProgram sessions={sessions} />
                  <EventSpeakers speakers={speakers} />
                </div>
              ) : sessions.length > 0 || speakers.length > 0 ? (
                <div className={styles.eventDetailsSingle}>
                  <EventProgram sessions={sessions} />
                  <EventSpeakers speakers={speakers} />
                </div>
              ) : null}

              <SalonTeaser slug={event.slug} privacy={event.salon_privacy} />
            </div>
          }
        />
      </div>
    </EditorialShell>
  );
}
