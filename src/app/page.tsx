import Link from "next/link";
import { ArrowRight, Sparkles, Users } from "lucide-react";

import { EventHorizontalList } from "@/components/events/event-horizontal-list";
import { HomeHero } from "@/components/home/home-hero";
import { OrganizerCtaSection } from "@/components/home/organizer-cta-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { EventRouteTransition } from "@/components/layout/event-route-transition";
import { Avatar } from "@/components/ui/avatar";
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
      getFeaturedEvents(10).catch(() => []),
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
        <EventRouteTransition>
          <HomeHero />

          {/* ── MODULE ÉVÉNEMENTS & SALONS EN DIRECT ────────────────────────── */}
          <section
            aria-labelledby="events-section-title"
            className="border-border bg-bg-subtle/50 border-b py-8 md:py-10"
          >
            <div className="container-page">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:gap-12">
                {/* Colonne Principale : Événements en défilement horizontal */}
                <div className="flex min-w-0 flex-col gap-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h2
                        id="events-section-title"
                        className="font-display text-2xl font-bold md:text-3xl"
                      >
                        Événements à la une
                      </h2>
                      <p className="text-fg-muted mt-1 text-xs md:text-sm">
                        Fais défiler les événements du moment et réserve tes places.
                      </p>
                    </div>
                    <Link
                      href={ROUTES.explore}
                      className="border-border-strong text-fg-muted hover:border-primary hover:text-primary hidden shrink-0 items-center gap-1.5 border-b px-1 py-1.5 text-xs font-semibold transition-colors sm:inline-flex"
                    >
                      Explorer tout l&apos;agenda
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </div>

                  <div className="no-scrollbar flex gap-2 overflow-x-auto">
                    <Link
                      href="/mes-salons"
                      className="border-border bg-surface text-fg-muted hover:border-border hover:text-fg shrink-0 rounded-md border px-3.5 py-1 text-xs font-medium transition-colors"
                    >
                      Mes Salons actifs
                    </Link>
                  </div>

                  {/* Événements sous forme de carrousel/défilement horizontal */}
                  {featured.length === 0 ? (
                    <EmptyState
                      title="Aucun événement pour le moment"
                      description="Reviens bientôt pour découvrir les prochains rendez-vous."
                      action={
                        <ButtonLink href="/devenir-organisateur">Devenir organisateur</ButtonLink>
                      }
                    />
                  ) : (
                    <EventHorizontalList events={featured} />
                  )}
                </div>

                {/* Sidebar Droite : Profile & Suggestions */}
                <aside className="hidden flex-col gap-6 lg:flex">
                  <div className="border-border bg-surface rounded-lg border p-5">
                    {profile ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={profile.avatar_url} name={profile.display_name} size="md" />
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
                            className="border-border bg-bg-muted hover:border-primary rounded border p-2.5 transition-colors"
                          >
                            <span className="text-fg-subtle block text-xs font-medium">
                              Billets
                            </span>
                            <span className="text-fg text-sm font-bold">Accéder</span>
                          </Link>
                          <Link
                            href="/connexions"
                            className="border-border bg-bg-muted hover:border-primary rounded border p-2.5 transition-colors"
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
                          Participe aux discussions, réserve tes billets et garde le contact avec
                          les autres participants.
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

                  {/* Bloc Organisateur en avant */}
                  <div className="border-primary/20 bg-primary/5 flex flex-col gap-3 rounded-lg border p-5">
                    <span className="text-primary inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                      <Sparkles className="size-3.5" aria-hidden="true" /> Espace Organisateur
                    </span>
                    <h3 className="font-display text-fg text-base font-bold">
                      Tu organises un événement ?
                    </h3>
                    <p className="text-fg-muted text-xs leading-relaxed">
                      Crée ta billetterie en ligne, vends tes billets en Mobile Money et gère tes
                      accès facilement.
                    </p>
                    <ButtonLink
                      href="/devenir-organisateur"
                      size="sm"
                      className="mt-1 w-full justify-center"
                    >
                      Devenir organisateur
                    </ButtonLink>
                  </div>

                  {/* Suggestions événements */}
                  <div className="border-border bg-surface rounded-lg border p-5">
                    <h3 className="text-fg-subtle mb-4 text-xs font-bold tracking-wider uppercase">
                      Accès rapides
                    </h3>
                    <ul className="flex flex-col gap-2">
                      <li>
                        <Link
                          href={ROUTES.explore}
                          className="border-border bg-bg-muted hover:border-primary flex items-center justify-between rounded border p-2.5 text-xs font-semibold transition-colors"
                        >
                          Tout l&apos;agenda
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={ROUTES.connections}
                          className="border-border bg-bg-muted hover:border-primary flex items-center justify-between rounded border p-2.5 text-xs font-semibold transition-colors"
                        >
                          Mes connexions
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      </li>
                    </ul>
                  </div>
                </aside>
              </div>
            </div>
          </section>

          {/* ── SECTION DÉDIÉE ORGANISATEUR (MISE EN AVANT FORTE) ───────────── */}
          <OrganizerCtaSection />

          {/* ── PRINCIPE DE FONCTIONNEMENT ──────────────────────────────────── */}
        </EventRouteTransition>
      </main>

      <SiteFooter />
    </div>
  );
}
