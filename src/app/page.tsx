import Link from "next/link";
import { ArrowRight, CalendarDays, MessageSquare, Users } from "lucide-react";

import { EventCard } from "@/components/events/event-card";
import { HomeHero } from "@/components/home/home-hero";
import { PostCard } from "@/components/social/post-card";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { EmptyState } from "@/components/ui/states";
import { ButtonLink } from "@/components/ui/button";
import { getFeaturedEvents } from "@/lib/events/queries";
import { getGlobalRecentPosts, getCommentsByPost } from "@/lib/salons/queries";
import { getCurrentProfile } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants";

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof getFeaturedEvents>> = [];
  let recentPosts: Awaited<ReturnType<typeof getGlobalRecentPosts>> = [];
  let commentsByPost = new Map();
  let profile = null;

  try {
    const [eventsRes, postsRes, prof] = await Promise.all([
      getFeaturedEvents(6).catch(() => []),
      getGlobalRecentPosts(5).catch(() => []),
      getCurrentProfile().catch(() => null),
    ]);
    featured = eventsRes;
    recentPosts = postsRes;
    profile = prof;

    if (recentPosts.length > 0) {
      commentsByPost = await getCommentsByPost(recentPosts.map((p) => p.id)).catch(
        () => new Map(),
      );
    }
  } catch {
    // Mode silencieux
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main id="contenu" className="flex flex-col">
        <HomeHero />

        <div className="container-page py-8 md:py-12">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] xl:gap-16">
            {/* Colonne Principale : Feed Hybride */}
            <div className="flex flex-col gap-12">
              <div className="flex flex-col gap-5 border-b-2 border-fg pb-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="flex items-center gap-3 font-display text-2xl font-bold md:text-3xl">
                      <span className="h-7 w-1 bg-primary" aria-hidden="true" />
                      Événements et échanges
                    </h2>
                    <p className="mt-1 text-sm text-fg-muted">
                      Événements publiés et dernières discussions dans les salons.
                    </p>
                  </div>
                  <Link
                    href={ROUTES.explore}
                    className="hidden sm:inline-flex items-center gap-1.5 border-b border-border-strong px-1 py-1.5 text-xs font-semibold text-fg-muted transition-colors hover:border-primary hover:text-primary"
                  >
                    Tout voir
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
                  <span className="shrink-0 rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold text-white">
                    Fil d’actualité
                  </span>
                  <Link
                    href="/explorer"
                    className="shrink-0 rounded-md border border-border bg-surface px-3.5 py-1 text-xs font-medium text-fg-muted transition-colors hover:border-border hover:text-fg"
                  >
                    Événements
                  </Link>
                  <Link
                    href="/mes-salons"
                    className="shrink-0 rounded-md border border-border bg-surface px-3.5 py-1 text-xs font-medium text-fg-muted transition-colors hover:border-border hover:text-fg"
                  >
                    Salons actifs
                  </Link>
                  <Link
                    href="/connexions"
                    className="shrink-0 rounded-md border border-border bg-surface px-3.5 py-1 text-xs font-medium text-fg-muted transition-colors hover:border-border hover:text-fg"
                  >
                    Mon réseau
                  </Link>
                </div>
              </div>

              {/* Activité récente des Salons */}
              {recentPosts.length > 0 && (
                <section aria-labelledby="discussions-recents">
                  <div className="mb-6 flex items-center justify-between border-b border-border pb-3">
                    <h3
                      id="discussions-recents"
                      className="text-lg font-bold text-fg flex items-center gap-2"
                    >
                      <MessageSquare className="size-4 text-primary" aria-hidden="true" />
                      Derniers échanges dans les salons
                    </h3>
                    <Link
                      href="/mes-salons"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Mes salons
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {recentPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        comments={commentsByPost.get(post.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Événements à la une */}
              <section aria-labelledby="a-venir">
                <div className="mb-6 flex items-center justify-between">
                  <h3 id="a-venir" className="text-xl items-center font-bold text-fg flex gap-2">
                    <CalendarDays className="size-5 text-primary" aria-hidden="true" />
                    Événements publiés
                  </h3>
                  <Link
                    href="/explorer"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Agenda complet
                  </Link>
                </div>

                {featured.length === 0 ? (
                  <EmptyState
                    title="Aucun événement pour le moment"
                    description="Reviens bientôt pour découvrir les prochains rendez-vous."
                    action={<ButtonLink href="/devenir-organisateur">Créer un événement</ButtonLink>}
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
            <aside className="hidden lg:flex flex-col gap-6">
              <div className="border-t-2 border-fg bg-surface p-5">
                {profile ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {profile.display_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-fg truncate">{profile.display_name}</p>
                        <p className="text-xs text-fg-subtle truncate">@{profile.username || "membre"}</p>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-center">
                      <Link
                        href="/mes-billets"
                        className="border border-border bg-bg-muted p-2.5 transition-colors hover:border-primary"
                      >
                        <span className="block text-xs font-medium text-fg-subtle">Billets</span>
                        <span className="text-sm font-bold text-fg">Accèder</span>
                      </Link>
                      <Link
                        href="/connexions"
                        className="border border-border bg-bg-muted p-2.5 transition-colors hover:border-primary"
                      >
                        <span className="block text-xs font-medium text-fg-subtle">Réseau</span>
                        <span className="text-sm font-bold text-fg">Voir</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 text-center py-2">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Users className="size-6" />
                    </div>
                    <h3 className="font-bold text-fg text-base">Rejoins la communauté</h3>
                    <p className="text-xs text-fg-muted leading-relaxed">
                      Participe aux discussions, réserve tes billets et garde le contact avec les autres participants.
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
              <div className="border-t-2 border-fg bg-surface p-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-fg-subtle mb-4">
                  Événements à venir
                </h3>
                <ul className="flex flex-col gap-3">
                  {featured.slice(0, 3).map((ev) => (
                    <li key={ev.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/evenements/${ev.slug}`}
                          className="font-semibold text-xs text-fg hover:text-primary transition-colors block truncate"
                        >
                          {ev.title}
                        </Link>
                        <span className="text-2xs text-fg-subtle block">
                          {ev.city}
                        </span>
                      </div>
                      <Link
                        href={`/evenements/${ev.slug}`}
                        className="rounded-md bg-primary/10 px-2.5 py-1 text-2xs font-bold text-primary hover:bg-primary/20 transition-colors shrink-0"
                      >
                        Rejoindre
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-2 text-2xs text-fg-subtle flex flex-wrap gap-x-3 gap-y-1">
                <Link href="/aide" className="hover:underline">Aide</Link>
                <Link href="/cgu" className="hover:underline">CGU</Link>
                <Link href="/confidentialite" className="hover:underline">Confidentialité</Link>
                <Link href="/devenir-organisateur" className="hover:underline">Organisateurs</Link>
                <span className="w-full mt-1">© {new Date().getFullYear()} Event</span>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
