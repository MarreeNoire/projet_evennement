import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Users } from "lucide-react";

import { SalonPolls } from "@/components/salons/salon-polls";
import { SalonFeed } from "@/components/salons/salon-feed";
import { SalonMuteButton } from "@/components/salons/salon-mute-button";
import { SalonPostCard } from "@/components/salons/salon-post-card";
import { PhaseTag } from "@/components/social/phase-tag";
import { SocialShell } from "@/components/social/social-shell";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { EmptyState } from "@/components/ui/states";
import { SALON_PRIVACY_LABELS, SALON_TABS } from "@/lib/constants";
import {
  getCommentsByPost,
  getEventsByIds,
  getSalonById,
  getSalonContext,
  getSalonMedia,
  getSalonMembers,
  getSalonPolls,
  getSalonPosts,
  type SalonEventInfo,
} from "@/lib/salons/queries";
import { getEventPhase, phaseStatus } from "@/lib/social/phase";
import { getCurrentProfile } from "@/lib/supabase/server";
import { cn, formatDateRange } from "@/lib/utils";
import type { MentionOption, ViewerInfo } from "@/components/salons/salon-shared";

export const metadata = {
  title: "Salon de l'événement",
  description: "Participe aux échanges, partage des photos et consulte le programme.",
};

/* =============================================================================
   Salon d'un événement — refonte « fil + commentaires »
   --------------------------------------------------------------------------
   Affiche événementielle + onglets. L'onglet « Publications » est le fil
   refondu : composeur, réactions, commentaires en overlay, temps réel,
   hors-ligne. Les autres onglets ( sondages, participants, photos… ) gardent
   leur logique. Le contexte spectateur (rôle, notifications, dernière
   lecture) est précalculé côté serveur et transmis aux composants clients.
   ========================================================================== */

type TabSlug = (typeof SALON_TABS)[number]["slug"];

export default async function SalonDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; post?: string }>;
}) {
  const { id } = await params;
  const { tab, post } = await searchParams;
  /* Un lien partagé `?post=…` ramène toujours dans le fil. */
  const activeTab: TabSlug = post
    ? "fil"
    : (SALON_TABS.find((item) => item.slug === tab)?.slug ?? "fil");

  const salon = await getSalonById(id);
  if (!salon) notFound();

  const [posts, members, profile, context, events, photos] = await Promise.all([
    getSalonPosts(id),
    getSalonMembers(id, 40),
    getCurrentProfile(),
    getSalonContext(id),
    salon.event_id
      ? getEventsByIds([salon.event_id])
      : Promise.resolve(new Map<string, SalonEventInfo>()),
    activeTab === "photos" ? getSalonMedia(id) : Promise.resolve([]),
  ]);
  const polls = activeTab === "sondages" ? await getSalonPolls(id) : [];

  const event = salon.event_id ? (events.get(salon.event_id) ?? null) : null;
  const commentsByPost = await getCommentsByPost(posts.map((post) => post.id));
  const commentsRecord = Object.fromEntries(commentsByPost);
  const now = new Date();
  const nowMs = now.getTime();
  const phase = event ? getEventPhase(event.start_at, event.end_at, now) : null;
  const memberCount = Math.max(salon.member_count ?? 0, members.length);

  const viewer: ViewerInfo = profile
    ? {
        id: profile.id,
        name: profile.display_name ?? "Membre",
        avatarUrl: profile.avatar_url,
        isVerified: profile.is_verified ?? false,
        role: context.role,
      }
    : { id: null, name: "Invité", avatarUrl: null, isVerified: false, role: null };

  const mentionMembers: MentionOption[] = members
    .filter((member) => member.user_id !== viewer.id)
    .map((member) => ({
      id: member.user_id,
      name: member.profile?.display_name ?? "Participant",
      avatarUrl: member.profile?.avatar_url ?? null,
    }));

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
            <li className="flex items-center gap-2">
              {salon.post_count ?? posts.length} publication
              {(salon.post_count ?? posts.length) > 1 ? "s" : ""}
            </li>
          </ul>
        </div>
      </header>

      {/* Onglets + notifications */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Sections du salon"
          className="no-scrollbar flex max-w-full gap-2 overflow-x-auto pb-2"
        >
          {SALON_TABS.map((item) => {
            const isActive = item.slug === activeTab;
            return (
              <Link
                key={item.slug}
                href={`/salons/${id}?tab=${item.slug}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-150",
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
        {context.userId ? (
          <SalonMuteButton salonId={id} muted={context.isMuted} />
        ) : null}
      </div>

      <div className="mt-6 grid gap-10 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          {activeTab === "fil" ? (
            <div className="mx-auto w-full max-w-[46rem] xl:mx-0">
              <SalonFeed
                salonId={id}
                posts={posts}
                commentsByPost={commentsRecord}
                viewer={viewer}
                organizerIds={context.organizerIds}
                members={mentionMembers}
                allowMedia={event?.allow_media_upload ?? true}
                canAnnounce={viewer.role === "owner" || viewer.role === "moderator"}
                nowMs={nowMs}
                lastReadAt={context.lastReadAt}
                focusPostId={post ?? null}
              />
            </div>
          ) : null}

          {activeTab === "sondages" ? (
            <SalonPolls salonId={id} polls={polls} profile={profile} />
          ) : null}

          {activeTab === "accueil" ? (
            <div className="flex flex-col gap-8">
              {event ? <EventPanel event={event} /> : null}
              <section aria-labelledby="annonces" className="flex flex-col gap-5">
                <h2 id="annonces" className="font-display text-2xl font-semibold">
                  Annonces de l&apos;organisateur
                </h2>
                {posts.filter((post) => post.kind === "announcement").length === 0 ? (
                  <EmptyState
                    title="Aucune annonce pour le moment"
                    description="Elles apparaîtront ici et en tête du fil des publications."
                  />
                ) : (
                  posts
                    .filter((post) => post.kind === "announcement")
                    .map((post) => (
                      <SalonPostCard
                        key={post.id}
                        post={post}
                        comments={commentsRecord[post.id] ?? []}
                        viewer={viewer}
                        organizerIds={context.organizerIds}
                        members={mentionMembers}
                        nowMs={nowMs}
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

        {/* Colonne latérale (grands écrans) : contexte du salon, y compris dans le fil. */}
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
