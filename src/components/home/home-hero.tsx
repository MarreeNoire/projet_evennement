import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { APP_NAME, CATEGORIES } from "@/lib/constants";

/* Hero de l'accueil : positionnement + recherche + catégories. */

export function HomeHero() {
  return (
    <section className="border-b border-border bg-gradient-to-b from-primary-subtle to-bg">
      <div className="container-page flex flex-col items-center gap-6 py-14 text-center md:py-20">
        <p className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-fg-muted">
          🎉 Chaque événement devient une communauté
        </p>
        <h1 className="max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl">
          Découvre, participe, rencontre — bien au-delà du billet.
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-fg-muted md:text-base">
          {APP_NAME} réunit billetterie mobile money, salon d'échange et networking :
          échange avant l'événement, vis-le ensemble, garde le lien après.
        </p>
        <form action="/explorer" method="get" role="search" className="flex w-full max-w-xl gap-2">
          <label htmlFor="home-search" className="sr-only">
            Rechercher un événement
          </label>
          <input
            id="home-search"
            name="q"
            type="search"
            placeholder="Concert, conférence, Abidjan…"
            className="h-12 flex-1 rounded-xl border border-border bg-surface px-4 text-[15px] placeholder:text-fg-subtle focus:border-border-focus focus:outline-none"
          />
          <ButtonLink href="/explorer" size="lg" className="shrink-0">
            Explorer
          </ButtonLink>
        </form>
        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.slice(0, 8).map((category) => (
            <Link
              key={category.slug}
              href={`/explorer?categorie=${category.slug}`}
              className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-fg-muted hover:border-border-strong hover:text-fg"
            >
              {category.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
