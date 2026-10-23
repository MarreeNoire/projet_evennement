import Link from "next/link";
import { BadgeCheck, CalendarDays, ChevronRight } from "lucide-react";

import { formatEventDate, formatEventPrice } from "@/components/home/home-data";
import { Gauge } from "@/components/home/hero/gauge";
import type { HeroSnapshot } from "@/components/home/hero/data";
import { APP_NAME, getCategoryLabel } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import type { PublishedEventView } from "@/types/database";

const CARD =
  "flex h-full flex-col rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

function EventsCard({ snapshot }: { snapshot: HeroSnapshot }) {
  const weekLabel =
    snapshot.thisWeekEvents > 0
      ? `${formatNumber(snapshot.thisWeekEvents)} cette semaine`
      : "0 cette semaine";

  return (
    <div className={CARD}>
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium text-[#ef4d23]">Événements</span>
        <span className="text-neutral-500">À venir</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[28px] font-semibold leading-none tracking-tight text-neutral-900">
          {formatNumber(snapshot.totalEvents)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
          <CalendarDays aria-hidden="true" className="h-3 w-3" />
          {weekLabel}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] text-neutral-500">Publiés sur {APP_NAME}</p>

      <p className="mt-4 text-center text-[11px] font-medium text-neutral-600">
        Catégories couvertes
      </p>
      <div className="mt-1">
        <Gauge
          value={snapshot.categoryPercent}
          color="#ef4d23"
          showLabels
          min={formatNumber(snapshot.categoryCount)}
          max={formatNumber(snapshot.categoryTotal)}
        />
      </div>

      <div className="mt-auto flex rounded-full bg-neutral-100 p-1">
        <Link
          href="/explorer"
          className="flex-1 rounded-full bg-white px-3 py-1.5 text-center text-[11px] font-medium text-neutral-900 shadow-sm"
        >
          À venir
        </Link>
        <Link
          href="/explorer?gratuit=1"
          className="flex-1 rounded-full px-3 py-1.5 text-center text-[11px] font-medium text-neutral-500 hover:text-neutral-800"
        >
          Gratuits
        </Link>
      </div>
    </div>
  );
}

function EmptyNextEventCard() {
  return (
    <div className={CARD}>
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium text-[#ef4d23]">Prochaine sortie</span>
        <span className="text-neutral-500">Bientôt</span>
      </div>
      <p className="mt-3 text-[15px] font-semibold text-neutral-900">
        Aucune sortie publiée pour le moment.
      </p>
      <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">
        Les prochains événements apparaîtront ici dès leur publication.
      </p>
      <div className="mt-auto pt-4">
        <Link
          href="/explorer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#ef4d23] px-5 py-2 text-sm font-medium text-white hover:bg-[#d9411b]"
        >
          Explorer les événements
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function NextEventCard({ event }: { event: PublishedEventView | null }) {
  if (!event) return <EmptyNextEventCard />;

  const dateInfo = formatEventDate(event.start_at);
  const eventHref = `/evenements/${event.slug}`;
  const ticketsHref = `${eventHref}/billets`;
  const location = event.venue_name ? `${event.venue_name}, ${event.city}` : event.city;

  return (
    <div className={CARD}>
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="font-medium text-[#ef4d23]">Prochaine sortie</span>
        <span className="truncate text-neutral-500">{dateInfo.dayMonth}</span>
      </div>

      <h3 className="mt-3 line-clamp-2 text-[18px] leading-snug font-semibold text-neutral-900">
        {event.title}
      </h3>
      <p className="mt-1 truncate text-[11px] text-neutral-500">Par {event.organizer_name}</p>

      <dl className="mt-4 flex flex-col gap-2 text-[12px]">
        <div className="flex justify-between gap-3">
          <dt className="shrink-0 text-neutral-500">Quand</dt>
          <dd className="text-right font-medium text-neutral-900">{dateInfo.fullBadge}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="shrink-0 text-neutral-500">Où</dt>
          <dd className="truncate text-right font-medium text-neutral-900">{location}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="shrink-0 text-neutral-500">Tarif</dt>
          <dd className="text-right font-medium text-neutral-900">{formatEventPrice(event)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="shrink-0 text-neutral-500">Catégorie</dt>
          <dd className="text-right font-medium text-neutral-900">
            {getCategoryLabel(event.category)}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center gap-3 pt-4">
        <Link
          href={ticketsHref}
          className="rounded-lg bg-[#ef4d23] px-5 py-2 text-sm font-medium text-white hover:bg-[#d9411b]"
        >
          Réserver
        </Link>
        <Link
          href={eventHref}
          className="text-sm text-neutral-700 underline underline-offset-2 hover:text-neutral-950"
        >
          Détails
        </Link>
        <Link
          href={eventHref}
          aria-label={`Voir ${event.title}`}
          className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function OrganizersCard({ snapshot }: { snapshot: HeroSnapshot }) {
  return (
    <div className={CARD}>
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium text-[#ef4d23]">Organisateurs</span>
        <span className="text-neutral-500">Actifs</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[28px] font-semibold leading-none tracking-tight text-neutral-900">
          {formatNumber(snapshot.organizerCount)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
          <BadgeCheck aria-hidden="true" className="h-3 w-3" />
          {formatNumber(snapshot.verifiedOrganizerCount)} vérifiés
        </span>
      </div>
      <p className="mt-1.5 text-[11px] text-neutral-500">
        {formatNumber(snapshot.cityCount)} ville{snapshot.cityCount > 1 ? "s" : ""} couverte
        {snapshot.cityCount > 1 ? "s" : ""}
      </p>

      <p className="mt-4 text-center text-[11px] font-medium text-neutral-600">
        Avec plusieurs sorties
      </p>
      <div className="mt-1">
        <Gauge value={snapshot.recurringPercent} color="#9ca3af" />
      </div>

      <div className="mt-auto flex rounded-full bg-neutral-100 p-1">
        <span className="flex-1 rounded-full bg-white px-3 py-1.5 text-center text-[11px] font-medium text-neutral-900 shadow-sm">
          Tous
        </span>
        <Link
          href="/organisateurs"
          className="flex-1 rounded-full px-3 py-1.5 text-center text-[11px] font-medium text-neutral-500 hover:text-neutral-800"
        >
          Vérifiés
        </Link>
      </div>
    </div>
  );
}

export function EventHeroDashboard({ snapshot }: { snapshot: HeroSnapshot }) {
  return (
    <div className="px-3 sm:px-4">
      <div className="mx-auto w-full max-w-[880px] rounded-3xl bg-[#f5f2ee] p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {/* Sur mobile, la prochaine sortie passe devant les statistiques :
              c'est l'information la plus actionnable du hero. */}
          <div className="order-2 h-full sm:order-1">
            <EventsCard snapshot={snapshot} />
          </div>
          <div className="order-1 h-full sm:order-2">
            <NextEventCard event={snapshot.nextEvent} />
          </div>
          <div className="order-3 h-full">
            <OrganizersCard snapshot={snapshot} />
          </div>
        </div>
      </div>
    </div>
  );
}
