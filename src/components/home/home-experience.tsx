"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowLeft, ArrowRight, Ticket } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { ROUTES, getCategoryLabel } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import type { PublishedEventView } from "@/types/database";

const categories = [
  { label: "Concerts", slug: "concerts", tone: "rose" },
  { label: "Conférences", slug: "conferences", tone: "ochre" },
  { label: "Salons", slug: "salons", tone: "green" },
  { label: "Formations", slug: "formations", tone: "blue" },
  { label: "Sport", slug: "sport", tone: "orange" },
  { label: "Culture", slug: "culture", tone: "plum" },
] as const;

function price(event: PublishedEventView) {
  if (event.min_price <= 0 && event.max_price <= 0) return "Entrée libre";
  return `Dès ${formatNumber(event.min_price)} FCFA`;
}

function dateLabel(value: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: "Africa/Abidjan",
    ...options,
  }).format(new Date(value));
}

function EventPoster({ event, hero = false }: { event: PublishedEventView; hero?: boolean }) {
  const image = event.cover_url ?? event.gallery?.[0];
  return (
    <article className={hero ? "home-poster home-poster-hero" : "home-poster home-poster-row"}>
      <Link
        href={`/evenements/${event.slug}`}
        className="home-poster-image"
        aria-label={`Découvrir ${event.title}`}
      >
        {image ? (
          <PublicStorageImage
            src={image}
            alt=""
            fill
            sizes={hero ? "(min-width: 900px) 350px, 78vw" : "(min-width: 900px) 25vw, 80vw"}
            quality={75}
            className="home-poster-photo"
          />
        ) : (
          <div
            className={`home-poster-art home-poster-art-${categories.findIndex((category) => category.slug === event.category) % 6}`}
          >
            <span>{getCategoryLabel(event.category)}</span>
            <strong>{event.title}</strong>
            <span>
              {dateLabel(event.start_at, { month: "short" }).toUpperCase()} · {event.city}
            </span>
          </div>
        )}
        {hero ? (
          <span className="home-poster-index">
            ÉVÉNEMENT · {dateLabel(event.start_at, { month: "short" }).toUpperCase()}
          </span>
        ) : null}
      </Link>
      <div className="home-poster-copy">
        <div className="home-poster-main">
          <div className="home-poster-meta">
            <span>{dateLabel(event.start_at)}</span>
            <span>{event.city}</span>
          </div>
          <h3>
            <Link href={`/evenements/${event.slug}`}>{event.title}</Link>
          </h3>
          <p>{price(event)}</p>
        </div>
        <Link
          href={`/evenements/${event.slug}/billets`}
          className="home-book"
          aria-label={`Réserver ${event.title}`}
        >
          <span>Réserver</span>
          <ArrowDownRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function EventRow({
  title,
  note,
  events,
}: {
  title: string;
  note: string;
  events: PublishedEventView[];
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  if (!events.length) return null;

  function scrollRow(direction: -1 | 1) {
    const track = rowRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <section className="home-section" aria-label={title}>
      <div className="home-section-heading">
        <div>
          <span>{note}</span>
          <h2>{title}</h2>
        </div>
        <div className="home-section-actions">
          <span className="home-row-hint">Glissez pour découvrir</span>
          <button onClick={() => scrollRow(-1)} aria-label={`Événements précédents : ${title}`}>
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
          <button onClick={() => scrollRow(1)} aria-label={`Événements suivants : ${title}`}>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <Link href={ROUTES.explore}>
            Tout voir <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className="home-poster-track" ref={rowRef}>
        {events.slice(0, 5).map((event) => (
          <EventPoster key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

export function HomeExperience({ events }: { events: PublishedEventView[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(events.length > 1 ? 1 : 0);

  const updateActiveSlide = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const center = track.getBoundingClientRect().left + track.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    Array.from(track.children).forEach((child, index) => {
      const bounds = child.getBoundingClientRect();
      const distance = Math.abs(bounds.left + bounds.width / 2 - center);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    setActiveSlide((current) => (current === nearestIndex ? current : nearestIndex));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || events.length < 2) return;
    const centerSlide = track.children[1] as HTMLElement | undefined;
    if (!centerSlide) return;
    const offset = centerSlide.getBoundingClientRect().left - track.getBoundingClientRect().left;
    track.scrollLeft += offset - (track.clientWidth - centerSlide.offsetWidth) / 2;
    updateActiveSlide();
  }, [events.length, updateActiveSlide]);
  const carouselEvents = events.length > 1 ? [events.at(-1)!, ...events.slice(0, 6)] : events;
  const now = Date.now();
  const week = now + 7 * 24 * 60 * 60 * 1000;
  const popular = events.slice(0, 6);
  const city = events[0]?.city;
  const nearby = city ? events.filter((event) => event.city === city).slice(0, 5) : [];
  const thisWeek = events
    .filter((event) => {
      const start = new Date(event.start_at).getTime();
      return start >= now && start <= week;
    })
    .slice(0, 5);
  const organizers = [
    ...new Map(events.map((event) => [event.organization_id, event])).values(),
  ].slice(0, 4);

  function moveHero(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.max(0, Math.min(track.children.length - 1, activeSlide + direction));
    const slide = track.children[next] as HTMLElement | undefined;
    if (!slide) return;
    const offset = slide.getBoundingClientRect().left - track.getBoundingClientRect().left;
    track.scrollTo({
      left: track.scrollLeft + offset - (track.clientWidth - slide.offsetWidth) / 2,
      behavior: "smooth",
    });
  }

  return (
    <div className="home-editorial">
      <section className="home-hero-stage" aria-labelledby="home-title">
        <div className="home-hero-intro">
          <div>
            <span className="home-live-mark" />
            Le calendrier vivant des événements africains
          </div>
          <h1 id="home-title">
            On se donne
            <br />
            rendez-vous.
          </h1>
          <p>
            Concerts, rencontres et billets publiés par les organisateurs. Trouvez ce qui rassemble.
          </p>
          <Link href={ROUTES.explore} className="home-hero-discover">
            Explorer les événements <ArrowDownRight size={17} />
          </Link>
        </div>

        {events.length ? (
          <div
            className="home-carousel"
            role="region"
            aria-roledescription="carrousel"
            aria-label="Événements à découvrir"
          >
            <div className="home-carousel-track" ref={trackRef} onScroll={updateActiveSlide}>
              {carouselEvents.map((event, index) => (
                <div
                  key={`${event.id}-${index}`}
                  data-active={activeSlide === index}
                  data-side={
                    index < activeSlide ? "left" : index > activeSlide ? "right" : "center"
                  }
                  className={`home-hero-slide home-hero-slide-${index}`}
                >
                  <EventPoster event={event} hero />
                </div>
              ))}
            </div>
            {events.length > 1 ? (
              <div className="home-carousel-controls">
                <span>
                  Faites glisser pour découvrir <span aria-hidden="true">↔</span>
                </span>
                <div>
                  <button
                    onClick={() => moveHero(-1)}
                    disabled={activeSlide === 0}
                    aria-label="Événement précédent"
                  >
                    <ArrowLeft size={17} />
                  </button>
                  <button
                    onClick={() => moveHero(1)}
                    disabled={activeSlide === carouselEvents.length - 1}
                    aria-label="Événement suivant"
                  >
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="home-empty">
            <Ticket size={20} />
            <p>Les prochains événements publiés apparaîtront ici.</p>
            <Link href="/devenir-organisateur">Publier un événement</Link>
          </div>
        )}
      </section>

      <nav className="home-categories" aria-label="Explorer par catégorie">
        <span className="home-categories-label">Explorer par envie</span>
        {categories.map((category, index) => (
          <Link
            key={category.slug}
            href={`/explorer?categorie=${category.slug}`}
            className={`home-category home-category-${category.tone}`}
          >
            <span>0{index + 1}</span>
            <strong>{category.label}</strong>
            <ArrowDownRight size={15} />
          </Link>
        ))}
      </nav>

      <div className="home-content">
        <EventRow title="À ne pas manquer" note="Les rendez-vous en vue" events={popular} />
        {nearby.length ? (
          <EventRow title={`À ${city}`} note="Dans la même ville" events={nearby} />
        ) : null}
        {thisWeek.length ? (
          <EventRow title="Cette semaine" note="Les prochains jours" events={thisWeek} />
        ) : null}

        {organizers.length ? (
          <section className="home-organizers">
            <div className="home-section-heading">
              <div>
                <span>Ceux qui font la scène</span>
                <h2>Les organisateurs</h2>
              </div>
              <Link href="/organisateurs">
                Tous les organisateurs <ArrowRight size={16} />
              </Link>
            </div>
            <div className="home-organizer-list">
              {organizers.map((event) => (
                <Link key={event.organization_id} href="/organisateurs" className="home-organizer">
                  <span className="home-organizer-initial">
                    {event.organizer_logo_url ? (
                      <PublicStorageImage
                        src={event.organizer_logo_url}
                        alt=""
                        fill
                        sizes="40px"
                        className="home-organizer-logo"
                      />
                    ) : (
                      event.organizer_name.slice(0, 1)
                    )}
                  </span>
                  <span>
                    <strong>{event.organizer_name}</strong>
                    <small>
                      {event.organizer_verified ? "Organisateur vérifié" : "Organisateur"}
                    </small>
                  </span>
                  <ArrowDownRight size={17} />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="home-organizer-cta">
          <div>
            <span>Vous imaginez la suite ?</span>
            <h2>Faites exister votre événement.</h2>
            <p>Publiez votre rendez-vous et retrouvez votre public au même endroit.</p>
          </div>
          <Link href="/devenir-organisateur">
            Devenir organisateur <ArrowDownRight size={17} />
          </Link>
        </section>
      </div>
    </div>
  );
}
