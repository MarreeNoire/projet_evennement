import Link from "next/link";
import { ArrowRight, Search, Sparkles } from "lucide-react";

import { APP_NAME, CATEGORIES, ROUTES } from "@/lib/constants";
import { ButtonLink } from "@/components/ui/button";
import { PublicStorageImage } from "@/components/ui/public-storage-image";
import type { PublishedEventView } from "@/types/database";
import {
  HomeHeroMotionScope,
  HomeHeroMotionToggle,
} from "@/components/home/home-hero-motion-scope";

export function HomeHero({ featuredEvent }: { featuredEvent?: PublishedEventView }) {
  return (
    <section className="border-border bg-bg-subtle border-b">
      <HomeHeroMotionScope className="container-page grid gap-6 py-7 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.82fr)] md:items-center md:gap-10 md:py-12 lg:gap-14 lg:py-16">
        <div className="flex flex-col gap-4">
          <Link
            href="/devenir-organisateur"
            className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-2 self-start rounded-md border px-3 py-1 text-xs font-semibold transition-colors"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            Organisateur ? Crée ta billetterie en ligne
            <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
          <div className="home-hero-heading flex max-w-3xl items-end justify-start gap-2">
            <h1
              aria-label="Le fil des événements et des rencontres"
              className="home-hero-title font-display w-fit min-w-0 text-4xl leading-[1.02] font-semibold tracking-tight md:text-5xl lg:text-6xl"
            >
              <span aria-hidden="true" className="block">
                Le fil des
              </span>
              <span aria-hidden="true" className="home-hero-word-slot">
                <span className="home-hero-word-rail">
                  <span>événements</span>
                  <span>rencontres</span>
                  <span>festivals</span>
                  <span>concerts</span>
                  <span>événements</span>
                </span>
              </span>
            </h1>
            <HomeHeroMotionToggle />
          </div>
          <p className="text-fg-muted max-w-xl text-base leading-relaxed md:text-lg">
            Suis les échanges dans les salons et découvre les événements publiés sur {APP_NAME}.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <ButtonLink href={ROUTES.explore} size="sm">
              Explorer l&apos;agenda
            </ButtonLink>
            <ButtonLink href="/devenir-organisateur" variant="secondary" size="sm">
              Devenir organisateur
            </ButtonLink>
          </div>
        </div>

        <div className="border-border bg-surface rounded-lg border p-4 sm:p-5 md:col-start-1 md:col-span-1 md:row-start-2">
          <form action="/explorer" method="get" role="search" className="flex flex-col gap-2">
            <label htmlFor="home-search" className="text-fg text-sm font-semibold">
              Rechercher un événement
            </label>
            <div className="border-border-strong bg-bg flex min-h-12 items-stretch rounded-md border">
              <Search className="text-fg-subtle my-auto ml-3 size-5 shrink-0" aria-hidden="true" />
              <input
                id="home-search"
                name="q"
                type="search"
                placeholder="Nom d’un événement ou d’une ville"
                className="text-fg placeholder:text-fg-subtle min-w-0 flex-1 bg-transparent px-3 text-base focus:outline-none"
              />
              <button
                type="submit"
                className="bg-primary-solid text-primary-solid-fg hover:bg-primary-solid-hover focus-visible:outline-border-focus my-1.5 mr-1.5 inline-flex items-center justify-center gap-2 rounded-sm px-4 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Rechercher
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </form>

          <nav aria-label="Catégories d’événements" className="mt-4">
            <h2 className="text-fg-muted mb-2 text-xs font-semibold">Catégories</h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {CATEGORIES.slice(0, 8).map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/explorer?categorie=${category.slug}`}
                    className="text-fg-muted decoration-border-strong hover:text-primary hover:decoration-primary text-sm underline underline-offset-4 transition-colors"
                  >
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {featuredEvent ? (
          <Link
            href={`/evenements/${featuredEvent.slug}`}
            className="group relative min-h-64 overflow-hidden rounded-lg border border-border-strong bg-bg-muted focus-visible:outline-2 focus-visible:outline-offset-4 md:col-start-2 md:row-start-1 md:row-span-2"
            aria-label={`Découvrir ${featuredEvent.title}`}
          >
            {featuredEvent.cover_url ? (
              <PublicStorageImage
                src={featuredEvent.cover_url}
                alt=""
                fill
                preload
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="absolute inset-0 bg-primary-subtle" />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-stone-950 p-5 text-white sm:p-7">
              <p className="text-xs font-semibold tracking-[0.16em] uppercase">À la une · {featuredEvent.city}</p>
              <p className="font-display mt-2 max-w-lg text-2xl leading-tight font-semibold sm:text-3xl">{featuredEvent.title}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                Voir l&apos;événement <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </div>
          </Link>
        ) : <TicketArtwork />}
      </HomeHeroMotionScope>
    </section>
  );
}

function TicketArtwork() {
  return (
    <div className="event-motion-scene" aria-hidden="true">
      <svg viewBox="0 0 360 270" className="event-motion-ticket" fill="none">
        <circle cx="181" cy="133" r="116" fill="var(--primary-subtle)" />

        <g>
          <g transform="rotate(8 180 135)">
            <path
              d="M67 59h226v45c-21 1-21 29 0 30v78H67v-43c21-1 21-29 0-30V59Z"
              fill="var(--accent-solid)"
            />
            <path
              d="M59 48h226v45c-21 1-21 29 0 30v78H59v-43c21-1 21-29 0-30V48Z"
              fill="var(--primary-solid)"
            />
            <path
              d="M235 96v105"
              stroke="var(--primary-solid-fg)"
              strokeOpacity=".56"
              strokeDasharray="3 6"
              strokeWidth="2"
            />
            <circle cx="147" cy="113" r="21" stroke="var(--brand-200)" strokeWidth="2" />
            <path
              d="M147 101v12l8 5M110 151h68M110 161h51"
              stroke="var(--surface-raised)"
              strokeLinecap="round"
              strokeWidth="3"
            />
            <text
              x="94"
              y="84"
              fill="var(--fg)"
              fontFamily="Inter, sans-serif"
              fontSize="10"
              fontWeight="700"
              letterSpacing="2"
            >
              EVENT
            </text>
            <text
              x="255"
              y="122"
              fill="var(--primary-solid-fg)"
              fontFamily="Inter, sans-serif"
              fontSize="9"
              fontWeight="700"
              letterSpacing="1.5"
              transform="rotate(90 255 122)"
            >
              BILLET
            </text>
            <path
              d="M256 164h14m-14 8h9m-9 8h14"
              stroke="var(--brand-200)"
              strokeLinecap="round"
              strokeWidth="2"
            />
            <circle cx="263" cy="84" r="3" fill="var(--accent-solid)" />
          </g>
        </g>
      </svg>
    </div>
  );
}
