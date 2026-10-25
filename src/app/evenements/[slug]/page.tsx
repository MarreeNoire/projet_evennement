import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { EventHero, EventPracticalInfo } from "@/components/events/event-hero";
import { EventProgram, EventSpeakers } from "@/components/events/event-program";
import { SalonTeaser, TicketPicker } from "@/components/events/event-ticketing";
import { EditorialShell } from "@/components/layout/editorial/editorial-shell";
import { getPublishedEventBySlug } from "@/lib/events/queries";

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

  return (
    <EditorialShell>
      <div className={shell.wrap}>
        <nav aria-label="Fil d’Ariane" className={shell.crumb} style={{ paddingTop: 18 }}>
          <Link href="/explorer">Explorer</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{event.title}</span>
        </nav>

        <div style={{ marginTop: 22 }}>
          <EventHero event={event} />
        </div>

        <div className={styles.eventLayout} style={{ marginTop: 34, paddingBottom: 40 }}>
          <div>
            <EventPracticalInfo event={event} />

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
