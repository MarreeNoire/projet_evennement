import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, FileText } from "lucide-react";

import { EventHero, EventPracticalInfo } from "@/components/events/event-hero";
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
          <Link href="/explorer" className="hover:text-fg hover:underline">
            Explorer
          </Link>
          {" / "}
          <span aria-current="page" className="text-fg break-words">
            {event.title}
          </span>
        </nav>

        <EventHero event={event} />

        <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
          <details className="group order-last overflow-hidden rounded-xl border border-border bg-surface lg:order-first">
            <summary className="hover:bg-bg-subtle focus-visible:ring-border-focus flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none sm:px-5">
              <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                <FileText className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                  <span className="text-fg block font-semibold">Détails de l’événement</span>
                  <span className="text-fg-muted mt-0.5 block text-sm">
                  Description, date, lieu et programme
                </span>
              </span>
              <ChevronDown
                className="text-fg-muted size-5 shrink-0 transition-transform duration-150 group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="border-border flex flex-col gap-8 border-t px-4 py-5 sm:px-5">
              <EventPracticalInfo event={event} />
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
          </details>

          <aside className="order-first flex min-w-0 flex-col gap-6 lg:sticky lg:top-20 lg:order-last">
            <TicketPicker ticketTypes={ticketTypes} slug={event.slug} />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
