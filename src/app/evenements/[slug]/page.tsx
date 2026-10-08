import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EventHero } from "@/components/events/event-hero";
import { EventProgram, EventSpeakers } from "@/components/events/event-program";
import { SalonTeaser, TicketPicker } from "@/components/events/event-ticketing";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getPublishedEventBySlug } from "@/lib/events/queries";

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

/* Page événement : hero + billetterie + programme + intervenants + salon. */

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublishedEventBySlug(slug).catch(() => null);
  if (!data) notFound();

  const { event, description, ticketTypes, sessions, speakers } = data;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex flex-col gap-8 py-8">
          <nav aria-label="Fil d'Ariane" className="text-fg-muted min-w-0 text-sm">
            <Link
              href="/explorer"
              className="hover:text-fg hover:underline"
            >
              Explorer
            </Link>
            {" / "}
            <span aria-current="page" className="text-fg break-words">
              {event.title}
            </span>
          </nav>

          <EventHero event={event} />

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="flex min-w-0 flex-col gap-8">
              {description ? (
                <section aria-labelledby="apropos" className="flex flex-col gap-3">
                  <h2 id="apropos" className="font-display text-xl font-bold">
                    À propos
                  </h2>
                  <p className="text-fg-muted text-[15px] leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                </section>
              ) : null}
              <EventProgram sessions={sessions} />
              <EventSpeakers speakers={speakers} />
              <SalonTeaser slug={event.slug} privacy={event.salon_privacy} />
            </div>

            <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
              <TicketPicker ticketTypes={ticketTypes} slug={event.slug} />
            </aside>
          </div>
      </main>
      <SiteFooter />
    </div>
  );
}
