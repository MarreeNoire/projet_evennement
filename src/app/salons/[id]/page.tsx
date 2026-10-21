import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Users } from "lucide-react";

import { SalonPostForm } from "@/components/salons/salon-post-form";
import { SalonPolls } from "@/components/salons/salon-polls";
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
  getSalonMembers,
  getSalonMedia,
  getSalonPolls,
  getSalonPosts,
  type SalonEventInfo,
} from "@/lib/salons/queries";
import type { PostWithAuthor } from "@/lib/salons/types";
import { getEventPhase, phaseStatus, type EventPhase } from "@/lib/social/phase";
import { getCurrentProfile } from "@/lib/supabase/server";
import { cn, formatDateRange } from "@/lib/utils";
import type { SalonPostCategory } from "@/types/database";

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
const PHASE_FILTER_ORDER: EventPhase[] = ["avant", "live", "apres"];
const PHASE_SHORT_TITLES: Record<EventPhase, string> = {
  avant: "Avant",
  live: "Sur place",
  apres: "Après",
};
const PHASE_TITLES: Record<EventPhase, string> = {
  avant: "Avant l’événement",
  live: "Sur place",
  apres: "Après l’événement",
};
const POST_CATEGORIES: { value: SalonPostCategory | "tous"; label: string }[] = [
  { value: "tous", label: "Tout" },
  { value: "discussion", label: "Discussion" },
  { value: "question", label: "Questions" },
  { value: "info_pratique", label: "Infos pratiques" },
  { value: "rencontre", label: "Rencontres" },
  { value: "covoiturage", label: "Covoiturage" },
  { value: "photo", label: "Photos" },
];

export default async function SalonDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; phase?: string; category?: string; unanswered?: string }>;
}) {
  const { id } = await params;
  const {
    tab,
    phase: requestedPhase,
    category: requestedCategory,
    unanswered,
  } = await searchParams;
  const activeTab: TabSlug = SALON_TABS.find((item) => item.slug === tab)?.slug ?? "fil";
  const phaseFilter = PHASE_FILTER_ORDER.find((item) => item === requestedPhase) ?? null;
  const selectedCategory = POST_CATEGORIES.some(
    (item) => item.value === requestedCategory && item.value !== "tous",
  )
    ? (requestedCategory as SalonPostCategory)
    : "tous";
  const unansweredOnly = unanswered === "1";

  const salon = await getSalonById(id);
  if (!salon) notFound();

  const [posts, members, profile, events, photos] = await Promise.all([
    getSalonPosts(id),
    getSalonMembers(id, 40),
    getCurrentProfile(),
    salon.event_id
      ? getEventsByIds([salon.event_id])
      : Promise.resolve(new Map<string, SalonEventInfo>()),
    activeTab === "photos" ? getSalonMedia(id) : Promise.resolve([]),
  ]);
  const polls = activeTab === "sondages" ? await getSalonPolls(id) : [];

  const event = salon.event_id ? (events.get(salon.event_id) ?? null) : null;
  const commentsByPost = await getCommentsByPost(posts.map((post) => post.id));
  const now = new Date();
  const phase = event ? getEventPhase(event.start_at, event.end_at, now) : null;
  const memberCount = Math.max(salon.member_count ?? 0, members.length);

  return (
    <SocialShell active="salons">
      {/* Affiche du salon */}
      <header className="bg-surface-raised border-border relative isolate min-h-64 overflow-hidden rounded-2xl border p-6 shadow-sm sm:min-h-80 sm:p-10">
        {event?.cover_url ? (
          <PublicStorageImage
            src={event.cover_url}
            alt=""
            className="absolute inset-0 z-0 size-full object-cover"
            sizes="100vw"
            fill
            quality={55}
          />
        ) : null}
        {event?.cover_url ? (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/55 to-black/15"
          />
        ) : (
          <div
            aria-hidden="true"
            className="from-primary/10 to-accent-subtle/60 absolute inset-0 z-10 bg-gradient-to-br via-transparent"
          />
        )}
        <div className={cn("relative z-10", event?.cover_url ? "text-white" : "text-fg")}>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-surface/15 text-2xs rounded-full px-3 py-1 font-semibold tracking-[0.12em] uppercase backdrop-blur-sm">
              Salon de l&apos;événement
            </span>
            {event && phase ? (
              <PhaseTag phase={phase} label={phaseStatus(event.start_at, event.end_at, now)} />
            ) : null}
          </div>

          <h1 className="font-display mt-5 max-w-3xl text-4xl leading-[1.02] font-semibold tracking-tight md:text-6xl">
            {salon.name}
          </h1>
          {salon.description ? (
            <p className="mt-4 max-w-2xl text-base leading-relaxed opacity-90">
              {salon.description}
            </p>
          ) : null}

          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium">
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
        className="no-scrollbar border-border mt-6 flex gap-2 overflow-x-auto border-b pb-2"
      >
        {SALON_TABS.map((item) => {
          const isActive = item.slug === activeTab;
          return (
            <Link
              key={item.slug}
              href={`/salons/${id}?tab=${item.slug}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center rounded-md px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-150",
                isActive
                  ? "bg-primary-solid text-primary-solid-fg shadow-sm"
                  : "text-fg-muted hover:bg-bg-muted hover:text-fg",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "mt-8 grid gap-10",
          activeTab === "fil" ? "grid-cols-1" : "xl:grid-cols-[minmax(0,1fr)_18rem]",
        )}
      >
        <div className="min-w-0">
          {activeTab === "sondages" ? (
            <SalonPolls salonId={id} polls={polls} profile={profile} />
          ) : null}

          {activeTab === "fil" ? (
            <Discussion
              salonId={id}
              posts={posts}
              commentsByPost={commentsByPost}
              event={event}
              profile={profile}
              phase={phase}
              phaseFilter={phaseFilter}
              selectedCategory={selectedCategory}
              unansweredOnly={unansweredOnly}
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
                    Aucune annonce pour le moment. Elles apparaîtront ici et dans le fil du salon.
                  </p>
                ) : (
                  posts
                    .filter((post) => post.kind === "announcement")
                    .map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        comments={commentsByPost.get(post.id)}
                        currentUserId={profile?.id}
                      />
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
                description="Les photos partagées dans les publications du salon apparaîtront ici."
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
        {activeTab !== "fil" ? (
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
        ) : null}
      </div>
    </SocialShell>
  );
}

/* ------------------------------ Discussion ------------------------------ */

const POST_GROUP_WINDOW_MS = 5 * 60 * 1000;

/** Regroupe les publications consécutives d'une même personne (même étiquette). */
function shouldGroup(previous: PostWithAuthor | undefined, post: PostWithAuthor): boolean {
  if (!previous) return false;
  if (previous.author_id !== post.author_id) return false;
  if (previous.kind === "announcement" || post.kind === "announcement") return false;
  if (previous.category !== post.category) return false;

  return (
    Math.abs(
      new Date(post.created_at).getTime() - new Date(previous.created_at).getTime(),
    ) <= POST_GROUP_WINDOW_MS
  );
}

function Discussion({
  salonId,
  posts,
  commentsByPost,
  event,
  profile,
  phase,
  phaseFilter,
  selectedCategory,
  unansweredOnly,
  allowMedia,
}: {
  salonId: string;
  posts: PostWithAuthor[];
  commentsByPost: Awaited<ReturnType<typeof getCommentsByPost>>;
  event: SalonEventInfo | null;
  profile: Awaited<ReturnType<typeof getCurrentProfile>>;
  phase: EventPhase | null;
  phaseFilter: EventPhase | null;
  selectedCategory: SalonPostCategory | "tous";
  unansweredOnly: boolean;
  allowMedia: boolean;
}) {
  const groups: Record<EventPhase, PostWithAuthor[]> = { avant: [], live: [], apres: [] };
  if (event) {
    for (const post of posts) {
      groups[getEventPhase(event.start_at, event.end_at, new Date(post.created_at))].push(post);
    }
  }
  const selectedPhase = phaseFilter ?? phase ?? "avant";
  const phasePosts = event ? groups[selectedPhase] : posts;
  const selectedPosts = phasePosts.filter((post) => {
    if (selectedCategory !== "tous" && post.category !== selectedCategory) return false;
    if (
      unansweredOnly &&
      (post.category !== "question" || (commentsByPost.get(post.id)?.length ?? 0) > 0)
    )
      return false;
    return true;
  });
  const filtersHref = (category: SalonPostCategory | "tous", unansweredValue: boolean) => {
    const query = new URLSearchParams({ tab: "fil" });
    if (event) query.set("phase", selectedPhase);
    if (category !== "tous") query.set("category", category);
    if (unansweredValue) query.set("unanswered", "1");
    return `/salons/${salonId}?${query.toString()}#salon-post-filters`;
  };

  return (
    <div className="flex flex-col gap-8">
      {event ? (
        <aside
          className="border-primary/20 bg-primary/5 rounded-2xl border p-4 sm:p-5"
          aria-label="Informations pratiques épinglées"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-primary text-xs font-bold tracking-wide uppercase">
                À retenir · {event.title}
              </p>
              <p className="text-fg mt-2 flex items-center gap-2 text-sm">
                <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                {formatDateRange(event.start_at, event.end_at)}
              </p>
              <p className="text-fg-muted mt-1 flex items-center gap-2 text-sm">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                {event.venue_name ? `${event.venue_name} · ` : ""}
                {event.city}
              </p>
            </div>
            <ButtonLink href={`/evenements/${event.slug}`} variant="secondary" size="sm">
              Détails
            </ButtonLink>
          </div>
        </aside>
      ) : null}
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

      <nav
        id="salon-post-filters"
        aria-label="Filtrer les publications"
        className="flex flex-col gap-3"
      >
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Étiquettes">
          {POST_CATEGORIES.map((item) => {
            const active = selectedCategory === item.value;
            const keepUnanswered =
              unansweredOnly && (item.value === "tous" || item.value === "question");
            return (
              <Link
                key={item.value}
                href={filtersHref(item.value, keepUnanswered)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface text-fg-muted hover:text-fg",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <Link
          href={filtersHref(unansweredOnly ? selectedCategory : "question", !unansweredOnly)}
          aria-current={unansweredOnly ? "page" : undefined}
          className={cn(
            "w-fit rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
            unansweredOnly
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-surface text-fg-muted hover:text-fg",
          )}
        >
          {unansweredOnly ? "✓ Questions sans réponse" : "Questions sans réponse"}
        </Link>
      </nav>

      {posts.length === 0 && !event ? (
        <EmptyState
          title="Le fil est encore vide"
          description="Sois la première personne à écrire dans ce salon."
        />
      ) : event ? (
        <div className="flex flex-col gap-5">
          <nav
            id="salon-phase-filter"
            aria-label="Filtrer les publications selon la période de l’événement"
            className="border-border bg-bg-subtle rounded-2xl border p-1.5"
          >
            <div className="grid grid-cols-3 gap-1">
              {PHASE_FILTER_ORDER.map((key) => {
                const isActive = selectedPhase === key;
                const count = groups[key].length;
                return (
                  <Link
                    key={key}
                    href={`/salons/${salonId}?tab=fil&phase=${key}#salon-phase-filter`}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-center transition-colors",
                      isActive
                        ? "bg-surface text-primary shadow-sm"
                        : "text-fg-muted hover:bg-surface/70 hover:text-fg",
                    )}
                  >
                    <span className="text-xs font-semibold sm:text-sm">
                      {PHASE_SHORT_TITLES[key]}
                    </span>
                    <span className="text-2xs text-fg-subtle">
                      {count} publication{count === 1 ? "" : "s"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <section
            id={`salon-phase-${selectedPhase}`}
            aria-labelledby="salon-phase-title"
            className="scroll-mt-24"
          >
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="salon-phase-title" className="font-display text-xl font-semibold sm:text-2xl">
                {PHASE_TITLES[selectedPhase]}
              </h2>
              {phase === selectedPhase ? (
                <span className="text-primary text-xs font-semibold">Période actuelle</span>
              ) : null}
            </div>
            {selectedPosts.length > 0 ? (
              selectedPosts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  comments={commentsByPost.get(post.id)}
                  currentUserId={profile?.id}
                  grouped={shouldGroup(selectedPosts[index - 1], post)}
                />
              ))
            ) : (
              <p className="text-fg-muted border-border bg-surface rounded-2xl border border-dashed px-4 py-6 text-sm">
                {unansweredOnly
                  ? "Aucune question sans réponse dans cette étape."
                  : phase === selectedPhase
                    ? "C’est la période actuelle. Sois le premier à publier ici."
                    : "Aucune publication pour cette période pour le moment."}
              </p>
            )}
          </section>
        </div>
      ) : (
        <section aria-label="Publications" className="flex flex-col">
          {selectedPosts.length ? (
            selectedPosts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                comments={commentsByPost.get(post.id)}
                currentUserId={profile?.id}
                grouped={shouldGroup(selectedPosts[index - 1], post)}
              />
            ))
          ) : (
            <p className="text-fg-muted border-border bg-surface rounded-2xl border border-dashed px-4 py-6 text-sm">
              {unansweredOnly
                ? "Aucune question sans réponse."
                : "Aucune publication ne correspond à ce filtre."}
            </p>
          )}
        </section>
      )}
    </div>
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
