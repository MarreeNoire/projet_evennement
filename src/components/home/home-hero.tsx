import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

import { APP_NAME, CATEGORIES } from "@/lib/constants";

export function HomeHero() {
  return (
    <section className="border-b border-border bg-bg-subtle">
      <div className="container-page grid gap-6 py-8 md:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,0.62fr)_minmax(20rem,0.9fr)] lg:items-center lg:gap-8 xl:gap-12">
        <div className="flex flex-col gap-3">
          <h1 className="max-w-3xl font-display text-3xl font-bold md:text-4xl">
            Le fil des événements et des rencontres
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-fg-muted md:text-base">
            Suis les échanges dans les salons et découvre les événements publiés sur {APP_NAME}.
          </p>
        </div>

        <TicketArtwork />

        <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
          <form action="/explorer" method="get" role="search" className="flex flex-col gap-2">
            <label htmlFor="home-search" className="text-sm font-semibold text-fg">
              Rechercher un événement
            </label>
            <div className="flex min-h-12 items-stretch rounded-md border border-border-strong bg-bg">
              <Search className="my-auto ml-3 size-5 shrink-0 text-fg-subtle" aria-hidden="true" />
              <input
                id="home-search"
                name="q"
                type="search"
                placeholder="Nom d’un événement ou d’une ville"
                className="min-w-0 flex-1 bg-transparent px-3 text-base text-fg placeholder:text-fg-subtle focus:outline-none"
              />
              <button
                type="submit"
                className="my-1.5 mr-1.5 inline-flex items-center justify-center gap-2 rounded-sm bg-primary-solid px-4 text-sm font-bold text-primary-solid-fg transition-colors hover:bg-primary-solid-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              >
                Rechercher
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </form>

          <nav aria-label="Catégories d’événements" className="mt-4">
            <h2 className="mb-2 text-xs font-semibold text-fg-muted">
              Catégories
            </h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {CATEGORIES.slice(0, 8).map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/explorer?categorie=${category.slug}`}
                    className="text-sm text-fg-muted underline decoration-border-strong underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
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
        <circle cx="181" cy="133" r="116" fill="#dce7e9" />
        <circle cx="181" cy="133" r="92" stroke="#9ab7be" strokeWidth="1.5" strokeDasharray="3 8" />
        <path d="M65 219 90 194M266 64l25-25M72 67 51 46" stroke="#72959f" strokeWidth="3" />
        <circle cx="294" cy="206" r="7" fill="#d0bf89" />
        <circle cx="76" cy="177" r="5" fill="#76524b" />

        <g transform="rotate(8 180 135)">
          <path d="M67 59h226v45c-21 1-21 29 0 30v78H67v-43c21-1 21-29 0-30V59Z" fill="#d0bf89" />
          <path d="M59 48h226v45c-21 1-21 29 0 30v78H59v-43c21-1 21-29 0-30V48Z" fill="#3d5c67" />
          <path d="M235 96v105" stroke="#dce7e9" strokeOpacity=".56" strokeDasharray="3 6" strokeWidth="2" />
          <circle cx="147" cy="113" r="21" stroke="#c0d2d6" strokeWidth="2" />
          <path d="M147 101v12l8 5M110 151h68M110 161h51" stroke="#f4f5f3" strokeLinecap="round" strokeWidth="3" />
          <text x="94" y="84" fill="#e5e9e8" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="700" letterSpacing="2">EVENT</text>
          <text x="255" y="122" fill="#e5e9e8" fontFamily="Inter, sans-serif" fontSize="9" fontWeight="700" letterSpacing="1.5" transform="rotate(90 255 122)">BILLET</text>
          <path d="M256 164h14m-14 8h9m-9 8h14" stroke="#c0d2d6" strokeLinecap="round" strokeWidth="2" />
          <circle cx="263" cy="84" r="3" fill="#d0bf89" />
        </g>
      </svg>
    </div>
  );
}
