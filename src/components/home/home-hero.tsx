"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Search, Sparkles } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { PublicStorageImage } from "@/components/ui/public-storage-image";
import {
  HomeHeroMotionScope,
  HomeHeroMotionToggle,
} from "@/components/home/home-hero-motion-scope";
import { HomeHeroPalette } from "@/components/home/home-hero-palette";
import { CATEGORIES, getCategoryLabel, ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { PublishedEventView } from "@/types/database";

export function HomeHero({ featuredEvents = [] }: { featuredEvents?: PublishedEventView[] }) {
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const featuredEvent = featuredEvents[featuredIndex];
  const cover = featuredEvent?.cover_url ?? featuredEvent?.gallery?.[0] ?? null;

  useEffect(() => {
    if (
      featuredEvents.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setFeaturedIndex((current) => (current + 1) % featuredEvents.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [featuredEvents.length]);

  return (
    <section className="home-hero border-border border-b">
      <HomeHeroPalette src={cover} />
      <HomeHeroMotionScope className="home-hero-motion-scope">
        <div className="home-hero-backdrop" aria-hidden="true">
          {cover ? (
            <PublicStorageImage
              key={cover}
              src={cover}
              alt=""
              fill
              preload
              sizes="100vw"
              quality={76}
              className="home-hero-backdrop-image"
            />
          ) : null}
          <div className="home-hero-backdrop-scrim" />
        </div>

        <div className="container-page home-hero-content">
          <div className="home-hero-topline">
            <Link href="/devenir-organisateur" className="home-hero-organizer-link">
              <Sparkles className="size-4" aria-hidden="true" />
              Organisateur ? Crée ta billetterie en ligne
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
            {cover ? <HomeHeroMotionToggle /> : null}
          </div>

          <div className="home-hero-layout">
            <div className="home-hero-copy">
              <h1 className="home-hero-title font-display">Trouve ton prochain moment à vivre.</h1>
              <p>
                Explore les événements, réserve ta place et retrouve ta communauté dans les salons.
              </p>
              <div className="home-hero-actions">
                <ButtonLink href={ROUTES.explore} size="sm">
                  Explorer l&apos;agenda
                </ButtonLink>
                <ButtonLink href="/devenir-organisateur" variant="secondary" size="sm">
                  Devenir organisateur
                </ButtonLink>
              </div>
            </div>

            {featuredEvent ? (
              <Link
                key={featuredEvent.id}
                href={`/evenements/${featuredEvent.slug}`}
                className="home-hero-featured-event"
                aria-label={`Découvrir ${featuredEvent.title}`}
                aria-live="off"
              >
                <span className="home-hero-featured-category">
                  {getCategoryLabel(featuredEvent.category)}
                </span>
                <span className="home-hero-featured-title">{featuredEvent.title}</span>
                <span className="home-hero-featured-meta">
                  <span>
                    <MapPin className="size-4 shrink-0" aria-hidden="true" />
                    {featuredEvent.city}
                  </span>
                  <span>
                    <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                    <time dateTime={featuredEvent.start_at}>
                      {formatDate(featuredEvent.start_at)}
                    </time>
                  </span>
                </span>
                <span className="home-hero-featured-action">
                  Voir l&apos;événement <ArrowRight className="size-4" aria-hidden="true" />
                </span>
              </Link>
            ) : null}
          </div>

          <div className="home-hero-search-panel">
            <form action="/explorer" method="get" role="search" className="home-hero-search-form">
              <label htmlFor="home-search" className="home-hero-search-label">
                Rechercher un événement
              </label>
              <div className="home-hero-search-control">
                <Search className="size-5 shrink-0" aria-hidden="true" />
                <input
                  id="home-search"
                  name="q"
                  type="search"
                  placeholder="Nom d’un événement ou d’une ville"
                />
                <button type="submit">
                  Rechercher <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </form>

            <nav aria-label="Catégories d’événements" className="home-hero-categories">
              <span>Explorer par catégorie</span>
              <ul>
                {CATEGORIES.slice(0, 8).map((category) => (
                  <li key={category.slug}>
                    <Link href={`/explorer?categorie=${category.slug}`}>{category.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </HomeHeroMotionScope>
    </section>
  );
}
