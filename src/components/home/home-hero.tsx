import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { APP_NAME, CATEGORIES } from "@/lib/constants";

/* =============================================================================
   Hero de l'accueil
   --------------------------------------------------------------------------
   Composition asymétrique : gros titre éditorial aligné à gauche, recherche
   soulignée façon champ de formulaire papier, et un billet illustré à droite.
   Le billet est purement décoratif (aria-hidden) : aucune information n'y est
   portée.
   ========================================================================== */

export function HomeHero() {
  return (
    <section className="border-b border-border">
      <div className="container-page grid gap-14 py-12 md:py-20 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-20">
        <div className="flex flex-col gap-8">
          <p className="eyebrow">Billetterie mobile money · Salons · Networking</p>

          <h1 className="font-display text-display font-semibold">
            <span className="block">Sors.</span>
            <span className="block font-normal text-primary italic">Rencontre.</span>
            <span className="block">Reste en contact.</span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-fg-muted md:text-lg">
            {APP_NAME} réunit billetterie mobile money, salon d&apos;échange et networking :
            échange avant l&apos;événement, vis-le ensemble, garde le lien après.
          </p>

          <form
            action="/explorer"
            method="get"
            role="search"
            className="flex w-full max-w-xl items-stretch border-b-2 border-border focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-border-focus"
          >
            <label htmlFor="home-search" className="sr-only">
              Rechercher un événement
            </label>
            <input
              id="home-search"
              name="q"
              type="search"
              placeholder="Concert, conférence, Abidjan…"
              className="h-14 min-w-0 flex-1 bg-transparent text-lg placeholder:text-fg-subtle focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-2 pl-4 font-semibold text-primary hover:text-primary-hover"
            >
              Explorer
              <ArrowRight className="size-5" aria-hidden="true" />
            </button>
          </form>

          <nav aria-label="Catégories" className="flex flex-col gap-3">
            <p className="eyebrow">Parcourir par genre</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {CATEGORIES.slice(0, 8).map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/explorer?categorie=${category.slug}`}
                    className="text-[15px] underline decoration-border-strong decoration-1 underline-offset-4 hover:text-primary hover:decoration-primary"
                  >
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <TicketIllustration />
      </div>
    </section>
  );
}

/* Billet décoratif : partie principale + talon détachable. */

function TicketIllustration() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-sm -rotate-2 lg:max-w-none">
      <div className="overflow-hidden rounded-lg">
        {/* Partie principale */}
        <div className="poster-pattern flex min-h-64 flex-col justify-between gap-10 bg-primary-solid p-7 text-primary-solid-fg sm:p-9">
          <p className="text-2xs font-semibold tracking-[0.14em] uppercase opacity-85">
            {APP_NAME} — Billet d&apos;entrée
          </p>
          <p className="font-display text-4xl leading-[1.02] font-medium sm:text-5xl">
            Ta place
            <br />
            <span className="font-normal italic">t&apos;attend.</span>
          </p>
          <p className="text-xs font-medium opacity-85">Wave · Orange Money · MTN MoMo · Moov</p>
        </div>

        {/* Perforation + encoches */}
        <div className="relative h-0 border-t-2 border-dashed border-border-strong bg-surface-raised">
          <span className="absolute -top-3 -left-3 size-6 rounded-full bg-bg" />
          <span className="absolute -top-3 -right-3 size-6 rounded-full bg-bg" />
        </div>

        {/* Talon */}
        <div className="flex items-center justify-between gap-6 bg-surface-raised px-7 py-5 text-fg sm:px-9">
          <div className="barcode h-12 flex-1 opacity-90" />
          <p className="font-display text-sm font-medium tracking-wide tabular-nums">TCK-0001</p>
        </div>
      </div>

      {/* Pastille « imprimée » */}
      <div className="absolute -top-5 -right-2 flex size-24 rotate-12 items-center justify-center rounded-full bg-accent-solid p-3 text-center font-display text-sm leading-tight font-semibold text-accent-solid-fg sm:-right-6">
        Paie en mobile money
      </div>
    </div>
  );
}
