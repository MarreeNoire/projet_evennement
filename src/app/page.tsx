import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Users,
  Wallet,
  PiggyBank,
  Ticket,
} from "lucide-react";

import { EventCard } from "@/components/events/event-card";
import { HomeHero } from "@/components/home/home-hero";
import { ModulesSection } from "@/components/home/modules-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { EmptyState } from "@/components/ui/states";
import { ButtonLink } from "@/components/ui/button";
import { getFeaturedEvents } from "@/lib/events/queries";
import { getCurrentProfile } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants";

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof getFeaturedEvents>> = [];
  let profile = null;

  try {
    const [eventsRes, prof] = await Promise.all([
      getFeaturedEvents(6).catch(() => []),
      getCurrentProfile().catch(() => null),
    ]);
    featured = eventsRes;
    profile = prof;
  } catch {
    // Mode silencieux
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main id="contenu" className="flex flex-col">
        <HomeHero />

        {/* ── Section Modules ─────────────────────────────────────────── */}
        <ModulesSection />

        {/* ── Feed principal + Sidebar ─────────────────────────────────── */}
        <div className="container-page py-8 md:py-12">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] xl:gap-16">
            {/* Colonne Principale : Feed Hybride */}
            <div className="flex flex-col gap-12">
              <div className="border-fg flex flex-col gap-5 border-b-2 pb-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display flex items-center gap-3 text-2xl font-bold md:text-3xl">
                      <span className="bg-primary h-7 w-1" aria-hidden="true" />
                      Événements et échanges
                    </h2>
                    <p className="text-fg-muted mt-1 text-sm">
                      Événements publiés et accès à tes salons.
                    </p>
                  </div>
                  <Link
                    href={ROUTES.explore}
                    className="border-border-strong text-fg-muted hover:border-primary hover:text-primary hidden items-center gap-1.5 border-b px-1 py-1.5 text-xs font-semibold transition-colors sm:inline-flex"
                  >
                    Tout voir
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>

                <div className="no-scrollbar flex gap-2 overflow-x-auto pt-1">
                  <span className="bg-primary shrink-0 rounded-md px-3.5 py-1.5 text-xs font-semibold text-white">
                    Fil d&apos;actualité
                  </span>
                  <Link
                    href="/explorer"
                    className="border-border bg-surface text-fg-muted hover:border-border hover:text-fg shrink-0 rounded-md border px-3.5 py-1 text-xs font-medium transition-colors"
                  >
                    Événements
                  </Link>
                  <Link
                    href="/mes-salons"
                    className="border-border bg-surface text-fg-muted hover:border-border hover:text-fg shrink-0 rounded-md border px-3.5 py-1 text-xs font-medium transition-colors"
                  >
                    Salons actifs
                  </Link>
                  <Link
                    href="/connexions"
                    className="border-border bg-surface text-fg-muted hover:border-border hover:text-fg shrink-0 rounded-md border px-3.5 py-1 text-xs font-medium transition-colors"
                  >
                    Mon réseau
                  </Link>
                </div>
              </div>

              {/* Événements à la une */}
              <section aria-labelledby="a-venir">
                <div className="mb-6 flex items-center justify-between">
                  <h3 id="a-venir" className="text-fg flex items-center gap-2 text-xl font-bold">
                    <CalendarDays className="text-primary size-5" aria-hidden="true" />
                    Événements publiés
                  </h3>
                  <Link
                    href="/explorer"
                    className="text-primary text-xs font-semibold hover:underline"
                  >
                    Agenda complet
                  </Link>
                </div>

                {featured.length === 0 ? (
                  <EmptyState
                    title="Aucun événement pour le moment"
                    description="Reviens bientôt pour découvrir les prochains rendez-vous."
                    action={
                      <ButtonLink href="/devenir-organisateur">Créer un événement</ButtonLink>
                    }
                  />
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {featured.slice(0, 4).map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar Droite : Networking & Suggestions */}
            <aside className="hidden flex-col gap-6 lg:flex">
              <div className="border-fg bg-surface border-t-2 p-5">
                {profile ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary flex size-12 items-center justify-center overflow-hidden rounded-full font-bold">
                        {profile.display_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-fg truncate font-bold">{profile.display_name}</p>
                        <p className="text-fg-subtle truncate text-xs">
                          @{profile.username || "membre"}
                        </p>
                      </div>
                    </div>
                    <div className="border-border/60 mt-2 grid grid-cols-2 gap-2 border-t pt-3 text-center">
                      <Link
                        href="/mes-billets"
                        className="border-border bg-bg-muted hover:border-primary border p-2.5 transition-colors"
                      >
                        <span className="text-fg-subtle block text-xs font-medium">Billets</span>
                        <span className="text-fg text-sm font-bold">Accèder</span>
                      </Link>
                      <Link
                        href="/connexions"
                        className="border-border bg-bg-muted hover:border-primary border p-2.5 transition-colors"
                      >
                        <span className="text-fg-subtle block text-xs font-medium">Réseau</span>
                        <span className="text-fg text-sm font-bold">Voir</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 py-2 text-center">
                    <div className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-full">
                      <Users className="size-6" />
                    </div>
                    <h3 className="text-fg text-base font-bold">Rejoins la communauté</h3>
                    <p className="text-fg-muted text-xs leading-relaxed">
                      Participe aux discussions, réserve tes billets et garde le contact avec les
                      autres participants.
                    </p>
                    <div className="mt-2 flex flex-col gap-2">
                      <ButtonLink href="/inscription" size="sm">
                        Créer un compte
                      </ButtonLink>
                      <ButtonLink href="/connexion" variant="ghost" size="sm">
                        Connexion
                      </ButtonLink>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              <div className="border-fg bg-surface border-t-2 p-5">
                <h3 className="text-fg-subtle mb-4 text-sm font-bold tracking-wider uppercase">
                  Événements à venir
                </h3>
                <ul className="flex flex-col gap-3">
                  {featured.slice(0, 3).map((ev) => (
                    <li key={ev.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/evenements/${ev.slug}`}
                          className="text-fg hover:text-primary block truncate text-xs font-semibold transition-colors"
                        >
                          {ev.title}
                        </Link>
                        <span className="text-2xs text-fg-subtle block">{ev.city}</span>
                      </div>
                      <Link
                        href={`/evenements/${ev.slug}`}
                        className="bg-primary/10 text-2xs text-primary hover:bg-primary/20 shrink-0 rounded-md px-2.5 py-1 font-bold transition-colors"
                      >
                        Rejoindre
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-2xs text-fg-subtle flex flex-wrap gap-x-3 gap-y-1 px-2">
                <Link href="/aide" className="hover:underline">
                  Aide
                </Link>
                <Link href="/cgu" className="hover:underline">
                  CGU
                </Link>
                <Link href="/confidentialite" className="hover:underline">
                  Confidentialité
                </Link>
                <Link href="/devenir-organisateur" className="hover:underline">
                  Organisateurs
                </Link>
                <span className="mt-1 w-full">© {new Date().getFullYear()} Event</span>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
