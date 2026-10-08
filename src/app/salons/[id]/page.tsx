import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Pin, Users } from "lucide-react";

import { SalonPostForm } from "@/components/salons/salon-post-form";
import { SalonLiveChat } from "@/components/salons/salon-live-chat";
import { PhaseTag } from "@/components/social/phase-tag";
import { PostCard } from "@/components/social/post-card";
import { SocialShell } from "@/components/social/social-shell";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { EmptyState } from "@/components/ui/states";
import { ROUTES, SALON_PRIVACY_LABELS, SALON_TABS } from "@/lib/constants";
import {
  getCommentsByPost,
  getEventsByIds,
  getSalonById,
  getSalonChatMessages,
  getSalonMembers,
  getSalonMedia,
  getSalonPosts,
  type SalonEventInfo,
} from "@/lib/salons/queries";
import type { PostWithAuthor } from "@/lib/salons/types";
import {
  getEventPhase,
  PHASE_DISPLAY_ORDER,
  phaseStatus,
  type EventPhase,
} from "@/lib/social/phase";
import { getCurrentProfile } from "@/lib/supabase/server";
import { cn, formatDateRange } from "@/lib/utils";

export const metadata = {
  title: "Salon de l'événement",
  description: "Participe aux échanges, partage des photos et consulte le programme.",
};

/* =============================================================================
   Salon d'un événement — « le fil de l'événement »
   --------------------------------------------------------------------------
   Le salon est une affiche (couleur de l'événement) surmontant un fil rangé
   par phases : Avant l'événement, Sur place, Après. Chaque publication est
   classée selon le moment où elle a été écrite par rapport à l'événement.
   ========================================================================== */

type TabSlug = (typeof SALON_TABS)[number]["slug"];
const PHASE_JOURNEY_ORDER: EventPhase[] = ["avant", "live", "apres"];
const PHASE_TITLES: Record<EventPhase, string> = {
  avant: "Avant l’événement",
  live: "Sur place",
  apres: "Après l’événement",
};

export default async function SalonDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab: TabSlug = SALON_TABS.find((item) => item.slug === tab)?.slug ?? "discussion";

  const salon = await getSalonById(id);
  if (!salon) notFound();

  const [posts, members, profile, events, photos, chatMessages] = await Promise.all([
    getSalonPosts(id),
    getSalonMembers(id, 40),
    getCurrentProfile(),
    salon.event_id
      ? getEventsByIds([salon.event_id])
      : Promise.resolve(new Map<string, SalonEventInfo>()),
    activeTab === "photos" ? getSalonMedia(id) : Promise.resolve([]),
    activeTab === "discussion" ? getSalonChatMessages(id) : Promise.resolve([]),
  ]);

  const event = salon.event_id ? (events.get(salon.event_id) ?? null) : null;
  const commentsByPost = await getCommentsByPost(posts.map((post) => post.id));
  const now = new Date();
  const phase = event ? getEventPhase(event.start_at, event.end_at, now) : null;
  const memberCount = Math.max(salon.member_count ?? 0, members.length);

  return (
    <SocialShell active="salons">
      {/* Affiche du salon */}
      <header className="bg-surface-raised relative overflow-hidden rounded-lg p-6 sm:p-10">
        {event?.cover_url ? (
          <PublicStorageImage
            src={event.cover_url}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-25"
            sizes="100vw"
            fill
            quality={55}
          />
        ) : null}
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xs font-semibold tracking-[0.14em] uppercase opacity-90">
              Salon de l&apos;événement
            </span>
            {event && phase ? (
              <PhaseTag phase={phase} label={phaseStatus(event.start_at, event.end_at, now)} />
            ) : null}
          </div>

          <h1 className="font-display mt-4 max-w-3xl text-4xl leading-[1.02] font-semibold md:text-6xl">
            {salon.name}
          </h1>
          {salon.description ? (
            <p className="mt-4 max-w-2xl text-base leading-relaxed opacity-90">
              {salon.description}
            </p>
          ) : null}

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            {event ? (
              <>
                <li className="flex items-center gap-2">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  {formatDateRange(event.start_at, event.end_at)}
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="size-4" aria-hidden="true" />
                  {event.venue_name ? `${event.venue_name} · ` : ""}
                  {event.city}
                </li>
              </>
            ) : null}
            <li className="flex items-center gap-2">
              <Users className="size-4" aria-hidden="true" />
              {memberCount} participant{memberCount > 1 ? "s" : ""}
            </li>
          </ul>
        </div>
      </header>

      {/* Onglets */}
      <nav
        aria-label="Sections du salon"
        className="no-scrollbar border-border mt-6 flex gap-6 overflow-x-auto border-b"
      >
        {SALON_TABS.map((item) => {
          const isActive = item.slug === activeTab;
          return (
            <Link
              key={item.slug}
              href={`/salons/${id}?tab=${item.slug}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 py-3 text-sm font-semibold whitespace-nowrap transition-colors duration-150",
                isActive
                  ? "border-primary text-fg"
                  : "text-fg-muted hover:text-fg border-transparent",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          {activeTab === "discussion" ? (
            <SalonLiveChat salonId={id} messages={chatMessages} profile={profile} />
          ) : null}

          {activeTab === "fil" ? (
            <Discussion
              salonId={id}
              posts={posts}
              commentsByPost={commentsByPost}
              event={event}
              profile={profile}
              phase={phase}
              allowMedia={event?.allow_media_upload ?? true}
            />
          ) : null}

          {activeTab === "accueil" ? (
            <div className="flex flex-col gap-8">
              {event ? <EventPanel event={event} /> : null}
              <section aria-labelledby="annonces" className="flex flex-col gap-5">
                <h2 id="annonces" className="font-display text-2xl font-semibold">
                  Annonces de l&apos;organisateur
                </h2>
                {posts.filter((post) => post.kind === "announcement").length === 0 ? (
                  <p className="text-fg-muted text-sm">
                    Aucune annonce pour le moment. Elles apparaîtront ici et dans la discussion.
                  </p>
                ) : (
                  posts
                    .filter((post) => post.kind === "announcement")
                    .map((post) => (
                      <PostCard key={post.id} post={post} comments={commentsByPost.get(post.id)} />
                    ))
                )}
              </section>
            </div>
          ) : null}

          {activeTab === "participants" ? (
            members.length === 0 ? (
              <EmptyState
                title="Personne pour l'instant"
                description="Les participants apparaissent ici dès qu'ils rejoignent le salon."
              />
            ) : (
              <ul className="grid gap-x-8 sm:grid-cols-2">
                {members.map((member) => {
                  const name = member.profile?.display_name ?? "Participant";
                  const isHost = member.role === "owner" || member.role === "moderator";
                  return (
                    <li
                      key={member.user_id}
                      className="border-border flex items-center gap-3 border-b py-4"
                    >
                      <Avatar src={member.profile?.avatar_url} name={name} size="md" />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/profil/${member.user_id}`}
                          className="hover:text-primary block truncate font-semibold hover:underline"
                        >
                          {name}
                        </Link>
                        <p className="text-fg-subtle truncate text-xs">
                          {member.profile?.city ?? "Côte d'Ivoire"}
                        </p>
                      </div>
                      {isHost ? (
                        <span className="bg-accent-solid text-2xs text-accent-solid-fg rounded-sm px-2 py-0.5 font-bold tracking-[0.08em] uppercase">
                          Hôte
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )
          ) : null}

          {activeTab === "photos" ? (
            photos.length === 0 ? (
              <EmptyState
                title="Pas encore de photos"
                description="Les photos publiées dans la discussion apparaîtront ici."
              />
            ) : (
              <ImageCarousel
                images={photos.map((photo) => ({
                  id: photo.id,
                  src: photo.url,
                  alt: photo.caption || "Photo partagée dans le salon",
                }))}
                label={`Photos partagées dans ${salon.name}`}
                slideClassName="aspect-square basis-[82%] sm:basis-[48%] lg:basis-[31%]"
                sizes="(min-width: 1024px) 31vw, (min-width: 640px) 48vw, 82vw"
                quality={65}
              />
            )
          ) : null}

          {activeTab === "programme" ? (
            <div className="flex flex-col items-start gap-4">
              <p className="text-fg-muted max-w-xl text-sm">
                Le programme complet, les intervenants et les horaires sont sur la page de
                l&apos;événement.
              </p>
              {event ? (
                <ButtonLink href={`/evenements/${event.slug}`} variant="secondary">
                  Voir le programme
                </ButtonLink>
              ) : null}
            </div>
          ) : null}

          {activeTab === "infos" ? (
            <div className="flex flex-col gap-8">
              {event ? <EventPanel event={event} /> : null}
              <dl className="border-border grid gap-x-10 border-t sm:grid-cols-2">
                <Fact label="Accès au salon" value={SALON_PRIVACY_LABELS[salon.privacy]} />
                <Fact label="Participants" value={String(memberCount)} />
                <Fact label="Publications" value={String(salon.post_count ?? posts.length)} />
                <Fact
                  label="Ouvert depuis"
                  value={new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
                    new Date(salon.created_at),
                  )}
                />
              </dl>
            </div>
          ) : null}
        </div>

        {/* Colonne latérale (grands écrans) */}
        <aside className="hidden flex-col gap-8 xl:flex" aria-label="Autour du salon">
          {event ? <EventPanel event={event} compact /> : null}
          {members.length > 0 ? (
            <section className="border-border border-t pt-4">
              <p className="eyebrow">Participants</p>
              <div className="mt-3">
                <AvatarGroup
                  max={6}
                  people={members.map((member) => ({
                    id: member.user_id,
                    name: member.profile?.display_name ?? "Participant",
                    avatarUrl: member.profile?.avatar_url,
                  }))}
                />
              </div>
              <Link
                href={`/salons/${id}?tab=participants`}
                className="text-primary mt-3 inline-block text-sm font-semibold underline underline-offset-4 hover:decoration-2"
              >
                Voir tout le monde
              </Link>
            </section>
          ) : null}
        </aside>
      </div>
    </SocialShell>
  );
}

/* ------------------------------ Discussion ------------------------------ */

function Discussion({
  salonId,
  posts,
  commentsByPost,
  event,
  profile,
  phase,
  allowMedia,
}: {
  salonId: string;
  posts: PostWithAuthor[];
  commentsByPost: Awaited<ReturnType<typeof getCommentsByPost>>;
  event: SalonEventInfo | null;
  profile: Awaited<ReturnType<typeof getCurrentProfile>>;
  phase: EventPhase | null;
  allowMedia: boolean;
}) {
  const pinned = posts.filter((post) => post.is_pinned);
  const regular = posts.filter((post) => !post.is_pinned);

  const groups: Record<EventPhase, PostWithAuthor[]> = { avant: [], live: [], apres: [] };
  if (event) {
    for (const post of regular) {
      groups[getEventPhase(event.start_at, event.end_at, new Date(post.created_at))].push(post);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {profile ? (
        <SalonPostForm
          salonId={salonId}
          author={{ name: profile.display_name, avatarUrl: profile.avatar_url }}
          phase={phase ?? undefined}
          allowMedia={allowMedia}
        />
      ) : (
        <div className="border-border flex flex-col gap-3 border-y py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-fg-muted text-sm">
            Connecte-toi pour publier et répondre dans le salon.
          </p>
          <ButtonLink href={`${ROUTES.login}?redirect=/salons/${salonId}`}>Se connecter</ButtonLink>
        </div>
      )}

      {posts.length === 0 && !event ? (
        <EmptyState
          title="Le fil est encore vide"
          description="Sois la première personne à écrire dans ce salon."
        />
      ) : (
        <>
          {pinned.length > 0 ? (
            <section aria-label="Publications épinglées">
              <div className="mb-5 flex items-center gap-3">
                <Pin className="text-primary size-4" aria-hidden="true" />
                <span className="eyebrow text-primary">Épinglé</span>
                <span aria-hidden="true" className="bg-border h-px flex-1" />
              </div>
              {pinned.map((post) => (
                <PostCard key={post.id} post={post} comments={commentsByPost.get(post.id)} />
              ))}
            </section>
          ) : null}

          {event ? (
            <>
              <PhaseJourney activePhase={phase} />
              <div className="flex flex-col gap-8">
                {PHASE_DISPLAY_ORDER.map((key) => (
                  <section
                    key={key}
                    id={`salon-phase-${key}`}
                    aria-labelledby={`salon-phase-title-${key}`}
                    className="scroll-mt-24"
                  >
                    <div className="border-border mb-4 flex items-center gap-3 border-t pt-4">
                      <h2
                        id={`salon-phase-title-${key}`}
                        className="font-display text-xl font-semibold"
                      >
                        {PHASE_TITLES[key]}
                      </h2>
                      <span aria-hidden="true" className="bg-border h-px flex-1" />
                      {phase === key ? (
                        <span className="text-primary text-xs font-semibold">Étape actuelle</span>
                      ) : null}
                    </div>
                    {groups[key].length > 0 ? (
                      groups[key].map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          comments={commentsByPost.get(post.id)}
                        />
                      ))
                    ) : (
                      <p className="text-fg-muted border-border border-b py-4 text-sm">
                        {phase === key
                          ? "Le salon est ouvert à cette étape. Lance la conversation depuis le formulaire ci-dessus."
                          : "Aucun échange n’est affiché pour cette étape."}
                      </p>
                    )}
                  </section>
                ))}
              </div>
            </>
          ) : regular.length > 0 ? (
            <section aria-label="Publications">
              {regular.map((post) => (
                <PostCard key={post.id} post={post} comments={commentsByPost.get(post.id)} />
              ))}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function PhaseJourney({ activePhase }: { activePhase: EventPhase | null }) {
  return (
    <nav
      aria-label="Parcours des échanges autour de l’événement"
      className="border-border border-y py-4"
    >
      <p className="mb-3 text-sm font-semibold">Les échanges suivent l’événement</p>
      <ol className="grid grid-cols-3 gap-2">
        {PHASE_JOURNEY_ORDER.map((key) => {
          const current = activePhase === key;
          return (
            <li key={key}>
              <a
                href={`#salon-phase-${key}`}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex min-h-14 flex-col justify-center border px-2 py-2 text-center transition-colors sm:px-3",
                  current
                    ? "border-primary bg-primary-subtle text-fg"
                    : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
                )}
              >
                <span className="text-xs leading-tight font-semibold sm:text-sm">
                  {PHASE_TITLES[key]}
                </span>
                <span className="text-2xs mt-1">
                  {current ? "Étape actuelle" : "Voir les échanges"}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ---------------------------- Blocs réutilisés ---------------------------- */

function EventPanel({ event, compact = false }: { event: SalonEventInfo; compact?: boolean }) {
  return (
    <section className="border-border border-t pt-4" aria-label="L'événement">
      <p className="eyebrow">L&apos;événement</p>
      <h2
        className={cn(
          "font-display mt-2 leading-tight font-semibold",
          compact ? "text-xl" : "text-3xl",
        )}
      >
        {event.title}
      </h2>
      <p className="text-fg-muted mt-2 text-sm">{formatDateRange(event.start_at, event.end_at)}</p>
      <p className="text-fg-muted text-sm">
        {event.venue_name ? `${event.venue_name} · ` : ""}
        {event.city}
      </p>
      <ButtonLink href={`/evenements/${event.slug}`} variant="secondary" size="sm" className="mt-4">
        Page de l&apos;événement
      </ButtonLink>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border flex flex-col gap-1 border-b py-4">
      <dt className="eyebrow">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
