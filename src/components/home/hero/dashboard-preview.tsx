import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarDays } from "lucide-react";

import { formatEventDate, formatEventPrice } from "@/components/home/home-data";
import { Gauge } from "@/components/home/hero/gauge";
import type { HeroSnapshot } from "@/components/home/hero/data";
import { APP_NAME, getCategoryLabel } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import type { PublishedEventView } from "@/types/database";

function EventsPanel({ snapshot }: { snapshot: HeroSnapshot }) {
  return (
    <div className="home-panel">
      <div className="home-panel-head">
        <span className="home-panel-label">Événements</span>
        <span className="home-panel-meta">À venir</span>
      </div>

      <div className="home-stat">
        <span className="home-stat-value">{formatNumber(snapshot.totalEvents)}</span>
        <span className="home-chip">
          <CalendarDays aria-hidden="true" className="size-3" />
          {formatNumber(snapshot.thisWeekEvents)} cette semaine
        </span>
      </div>

      <p className="home-panel-note">Publiés sur {APP_NAME}</p>

      <div className="mt-1">
        <Gauge
          value={snapshot.categoryPercent}
          label="Catégories couvertes"
          min={`${formatNumber(snapshot.categoryCount)} catégories`}
          max={`sur ${formatNumber(snapshot.categoryTotal)}`}
        />
      </div>

      <div className="home-panel-foot">
        <Link href="/explorer" className="home-panel-link home-panel-link-primary flex-1">
          Explorer
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
        <Link href="/explorer?gratuit=1" className="home-panel-link flex-1">
          Gratuits
        </Link>
      </div>
    </div>
  );
}

function EmptyNextEvent() {
  return (
    <div className="home-panel">
      <div className="home-panel-head">
        <span className="home-panel-label">Prochaine sortie</span>
        <span className="home-panel-meta">Bientôt</span>
      </div>
      <p className="home-ticket-title">Aucune sortie publiée pour le moment.</p>
      <p className="home-empty-note">
        Les prochains événements apparaîtront ici dès leur publication.
      </p>
      <div className="home-panel-foot">
        <Link href="/explorer" className="home-panel-link home-panel-link-primary">
          Explorer les événements
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

function NextEventPanel({ event }: { event: PublishedEventView | null }) {
  if (!event) return <EmptyNextEvent />;

  const date = formatEventDate(event.start_at);
  const eventHref = `/evenements/${event.slug}`;
  const location = event.venue_name ? `${event.venue_name}, ${event.city}` : event.city;

  return (
    <div className="home-panel">
      <div className="home-panel-head">
        <span className="home-panel-label">Prochaine sortie</span>
        <span className="home-panel-meta">{date.dayMonth}</span>
      </div>

      <div className="home-ticket">
        <h3 className="home-ticket-title line-clamp-2">{event.title}</h3>
        <p className="home-panel-note truncate">Par {event.organizer_name}</p>

        <div className="home-ticket-tear" aria-hidden="true" />

        <dl className="flex flex-col gap-1.5">
          <div className="home-panel-row">
            <dt>Quand</dt>
            <dd>{date.fullBadge}</dd>
          </div>
          <div className="home-panel-row">
            <dt>Où</dt>
            <dd>{location}</dd>
          </div>
          <div className="home-panel-row">
            <dt>Tarif</dt>
            <dd>{formatEventPrice(event)}</dd>
          </div>
          <div className="home-panel-row">
            <dt>Catégorie</dt>
            <dd>{getCategoryLabel(event.category)}</dd>
          </div>
        </dl>
      </div>

      <div className="home-panel-foot">
        <Link href={`${eventHref}/billets`} className="home-panel-link home-panel-link-primary">
          Réserver
        </Link>
        <Link href={eventHref} className="home-panel-link">
          Détails
        </Link>
      </div>
    </div>
  );
}

function OrganizersPanel({ snapshot }: { snapshot: HeroSnapshot }) {
  const cityLabel = `${formatNumber(snapshot.cityCount)} ville${snapshot.cityCount > 1 ? "s" : ""}`;

  return (
    <div className="home-panel">
      <div className="home-panel-head">
        <span className="home-panel-label">Organisateurs</span>
        <span className="home-panel-meta">Actifs</span>
      </div>

      <div className="home-stat">
        <span className="home-stat-value">{formatNumber(snapshot.organizerCount)}</span>
        <span className="home-chip">
          <BadgeCheck aria-hidden="true" className="size-3" />
          {formatNumber(snapshot.verifiedOrganizerCount)} vérifiés
        </span>
      </div>

      <p className="home-panel-note">
        {cityLabel} couverte{snapshot.cityCount > 1 ? "s" : ""}
      </p>

      <div className="mt-1">
        <Gauge
          value={snapshot.recurringPercent}
          label="Organisateurs avec plusieurs sorties"
          min={`${formatNumber(snapshot.recurringOrganizerCount)} récurrents`}
          max={`sur ${formatNumber(snapshot.organizerCount)}`}
        />
      </div>

      <div className="home-panel-foot">
        <Link href="/organisateurs" className="home-panel-link home-panel-link-primary flex-1">
          Tous
        </Link>
        <Link href="/organisateurs" className="home-panel-link flex-1">
          Vérifiés
        </Link>
      </div>
    </div>
  );
}

export function EventHeroDashboard({ snapshot }: { snapshot: HeroSnapshot }) {
  return (
    <div className="home-dash">
      <EventsPanel snapshot={snapshot} />
      <NextEventPanel event={snapshot.nextEvent} />
      <OrganizersPanel snapshot={snapshot} />
    </div>
  );
}
