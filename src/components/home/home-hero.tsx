import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

import { APP_NAME, CATEGORIES } from "@/lib/constants";

export function HomeHero() {
  return (
    <section className="border-border bg-bg-subtle border-b">
      <div className="container-page grid gap-6 py-8 md:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,0.62fr)_minmax(20rem,0.9fr)] lg:items-center lg:gap-8 xl:gap-12">
        <div className="flex flex-col gap-3">
          <h1 className="font-display max-w-3xl text-3xl font-bold md:text-4xl">
            Le fil des événements et des rencontres
          </h1>
          <p className="text-fg-muted max-w-2xl text-sm leading-relaxed md:text-base">
            Suis les échanges dans les salons et découvre les événements publiés sur {APP_NAME}.
          </p>
        </div>

        <TicketArtwork />

        <div className="border-border bg-surface rounded-lg border p-4 sm:p-5">
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
      </div>
    </section>
  );
}

function TicketArtwork() {
  return (
    <div className="mx-auto w-full max-w-xs lg:max-w-none" aria-hidden="true">
      <svg viewBox="0 0 360 270" className="h-auto w-full" fill="none">
        <circle cx="181" cy="133" r="116" fill="var(--primary-subtle)" />
        <circle
          cx="181"
          cy="133"
          r="92"
          stroke="var(--brand-300)"
          strokeWidth="1.5"
          strokeDasharray="3 8"
        />
        <path
          d="M65 219 90 194M266 64l25-25M72 67 51 46"
          stroke="var(--brand-400)"
          strokeWidth="3"
        />
        <circle cx="294" cy="206" r="7" fill="var(--accent-solid)" />
        <circle cx="76" cy="177" r="5" fill="var(--brand-500)" />

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
      </svg>
    </div>
  );
}
