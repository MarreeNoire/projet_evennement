import Link from "next/link";
import { BadgeCheck, Megaphone, Pin } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import type { CommentWithAuthor, PostWithAuthor } from "@/lib/salons/types";
import { formatClock, formatRelative } from "@/lib/social/time";
import { cn } from "@/lib/utils";

import { PostEditControl } from "./post-edit-control";
import { PostActions } from "./post-actions";
import { CommentThreadList } from "./comment-thread-list";

const CATEGORY_LABELS: Record<string, string> = {
  discussion: "Discussion",
  question: "Question",
  info_pratique: "Info pratique",
  rencontre: "Rencontre",
  covoiturage: "Covoiturage",
  photo: "Photo",
};

/* =============================================================================
   Publication du fil d'un salon
   --------------------------------------------------------------------------
   Fil continu : pas de carte, pas d'ombre. L'avatar occupe une gouttière fixe
   et les publications consécutives d'une même personne sont regroupées (nom
   et avatar affichés une seule fois), comme dans une conversation.
   ========================================================================== */

export function PostCard({
  post,
  comments = [],
  currentUserId = null,
  grouped = false,
}: {
  post: PostWithAuthor;
  comments?: CommentWithAuthor[];
  currentUserId?: string | null;
  /** Vrai si la publication suit immédiatement une publication du même auteur. */
  grouped?: boolean;
}) {
  const authorName = post.author?.display_name ?? "Membre du salon";
  const isAnnouncement = post.kind === "announcement";
  const isOwn = Boolean(currentUserId && post.author?.id === currentUserId);
  const compact = grouped && !isOwn && !isAnnouncement;
  const images = (Array.isArray(post.media) ? post.media : []).filter(
    (item) => item.kind === "image" && item.url,
  );
  const categoryLabel = CATEGORY_LABELS[post.category] ?? "Discussion";

  return (
    <article
      className={cn(
        "group border-border/60 relative flex gap-3 border-b last:border-b-0",
        compact ? "pt-1.5 pb-1" : "pt-5 pb-1.5",
      )}
    >
      {/* Gouttière : avatar, ou heure seule quand le message est regroupé. */}
      <div className="flex w-8 shrink-0 flex-col items-center">
        {compact ? (
          <time
            className="text-fg-subtle pt-0.5 text-[10px] tabular-nums"
            dateTime={post.created_at}
            title={formatRelative(post.created_at)}
          >
            {formatClock(post.created_at)}
          </time>
        ) : post.author ? (
          <Link
            href={`/profil/${post.author.id}`}
            aria-label={`Profil de ${authorName}`}
            className="shrink-0 transition-opacity hover:opacity-85"
          >
            <Avatar src={post.author.avatar_url} name={authorName} size="sm" />
          </Link>
        ) : (
          <Avatar name={authorName} size="sm" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {compact ? (
          <span className="sr-only">
            {authorName}, <time dateTime={post.created_at}>{formatRelative(post.created_at)}</time>
          </span>
        ) : (
          <header className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {post.author ? (
              <Link
                href={`/profil/${post.author.id}`}
                className="text-fg text-sm font-semibold hover:underline hover:underline-offset-4"
              >
                {authorName}
              </Link>
            ) : (
              <span className="text-fg text-sm font-semibold">{authorName}</span>
            )}
            {post.author?.is_verified ? (
              <BadgeCheck className="text-primary size-3.5 shrink-0" aria-label="Profil vérifié" />
            ) : null}
            <time className="text-fg-subtle text-xs" dateTime={post.created_at}>
              · {formatRelative(post.created_at)}
            </time>
            {post.updated_at &&
            new Date(post.updated_at).getTime() > new Date(post.created_at).getTime() + 1000 ? (
              <span className="text-fg-subtle text-[11px]">modifiée</span>
            ) : null}
            {post.is_pinned ? (
              <span className="text-fg-muted inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.1em] uppercase">
                <Pin className="size-3" aria-hidden="true" />
                Épinglé
              </span>
            ) : null}
            {!isAnnouncement && post.category !== "discussion" ? (
              <span className="text-fg-subtle text-[10px] font-semibold tracking-[0.12em] uppercase">
                · {categoryLabel}
              </span>
            ) : null}
            {isOwn ? (
              <span className="ml-auto">
                <PostEditControl postId={post.id} content={post.content} />
              </span>
            ) : null}
          </header>
        )}

        {isAnnouncement ? (
          <div className="border-accent/50 bg-accent-subtle/40 mt-2 border-l-2 px-3 py-2.5">
            <p className="text-accent-subtle-fg flex items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] uppercase">
              <Megaphone className="size-3.5" aria-hidden="true" />
              Annonce de l&apos;organisateur
            </p>
            <p className="text-fg mt-1 text-[0.95rem] leading-relaxed whitespace-pre-line">
              {post.content}
            </p>
          </div>
        ) : (
          <p className="text-fg mt-1 text-[0.95rem] leading-relaxed whitespace-pre-line">
            {post.content}
          </p>
        )}

        {images.length > 0 ? (
          <ul
            className={cn(
              "mt-3 grid max-w-md gap-1 overflow-hidden rounded-lg",
              images.length > 1 ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            {images.slice(0, 4).map((image) => (
              <li key={image.url} className="bg-bg-muted relative aspect-4/3 overflow-hidden">
                {/* Les URL signées du bucket privé sont dynamiques et ne passent pas par l'optimiseur Next. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={`Photo partagée par ${authorName}`}
                  className="size-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </li>
            ))}
          </ul>
        ) : null}

        {comments.length > 0 ? (
          <section
            aria-label="Discussion de la publication"
            className="border-border/70 mt-3 border-l pl-3"
          >
            <p className="text-fg-subtle mb-2 text-[10px] font-semibold tracking-[0.12em] uppercase">
              Discussion · {Math.max(post.comment_count ?? 0, comments.length)}
            </p>
            <CommentThreadList
              comments={comments}
              postId={post.id}
              salonId={post.salon_id}
              currentUserId={currentUserId}
            />
          </section>
        ) : null}

        <PostActions
          postId={post.id}
          reactionCount={post.reaction_count ?? 0}
          commentCount={post.comment_count ?? comments.length}
          hasReacted={post.has_reacted}
        />
      </div>
    </article>
  );
}
