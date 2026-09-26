import Link from "next/link";
import { BadgeCheck, Megaphone } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import type { CommentWithAuthor, PostWithAuthor } from "@/lib/salons/types";
import { formatRelative } from "@/lib/social/time";

import { PostActions } from "./post-actions";

/* =============================================================================
   Publication du fil d'un salon
   --------------------------------------------------------------------------
   Pas de carte : un fil continu. La ligne verticale sous l'avatar relie la
   publication à ses réponses, comme le fil d'une conversation. Les annonces
   de l'organisateur sont posées sur un aplat jaune, avec leur propre étiquette.
   ========================================================================== */

export function PostCard({
  post,
  comments = [],
}: {
  post: PostWithAuthor;
  comments?: CommentWithAuthor[];
}) {
  const authorName = post.author?.display_name ?? "Membre du salon";
  const isAnnouncement = post.kind === "announcement";
  const images = (Array.isArray(post.media) ? post.media : []).filter(
    (item) => item.kind === "image" && item.url,
  );

  return (
    <article className="group border-border bg-surface hover:border-border-strong mb-4 border-y px-4 py-5 transition-colors sm:px-5 sm:py-6">
      <div className="flex items-start gap-3">
        {post.author ? (
          <Link
            href={`/profil/${post.author.id}`}
            aria-label={`Profil de ${authorName}`}
            className="shrink-0 transition-opacity hover:opacity-85"
          >
            <Avatar src={post.author.avatar_url} name={authorName} size="md" />
          </Link>
        ) : (
          <div className="shrink-0">
            <Avatar name={authorName} size="md" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {post.author ? (
              <Link
                href={`/profil/${post.author.id}`}
                className="text-fg hover:text-primary font-semibold transition-colors"
              >
                {authorName}
              </Link>
            ) : (
              <span className="text-fg font-semibold">{authorName}</span>
            )}
            {post.author?.is_verified ? (
              <BadgeCheck className="text-primary size-4" aria-label="Profil vérifié" />
            ) : null}
            <span className="text-fg-subtle text-xs">· {formatRelative(post.created_at)}</span>
            {post.is_pinned ? (
              <span className="bg-primary/10 text-2xs text-primary inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-bold">
                Épinglé
              </span>
            ) : null}
          </header>

          {isAnnouncement ? (
            <div className="border-accent/30 bg-accent-subtle/70 mt-3 border-y px-3.5 py-3">
              <p className="text-2xs text-accent-subtle-fg flex items-center gap-1.5 font-bold tracking-wider uppercase">
                <Megaphone className="size-3.5" aria-hidden="true" />
                Annonce de l&apos;organisateur
              </p>
              <p className="text-fg mt-1.5 text-sm leading-relaxed whitespace-pre-line">
                {post.content}
              </p>
            </div>
          ) : (
            <p className="text-fg mt-2 text-base leading-relaxed whitespace-pre-line">
              {post.content}
            </p>
          )}

          {images.length > 0 ? (
            <ul
              className={`border-border mt-4 grid gap-1 overflow-hidden border ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {images.slice(0, 4).map((image) => (
                <li key={image.url} className="bg-bg-muted relative aspect-4/3 overflow-hidden">
                  {/* Les URL signées du bucket privé sont dynamiques et ne passent pas par l'optimiseur Next. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={`Photo partagée par ${authorName}`}
                    className="size-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </li>
              ))}
            </ul>
          ) : null}

          <PostActions
            postId={post.id}
            reactionCount={post.reaction_count ?? 0}
            commentCount={comments.length || post.comment_count || 0}
            hasReacted={post.has_reacted}
          />

          {comments.length > 0 ? (
            <ul className="bg-bg-subtle border-border mt-4 flex flex-col gap-2.5 border-y px-3 py-3">
              {comments.map((comment) => {
                const name = comment.author?.display_name ?? "Membre du salon";
                return (
                  <li key={comment.id} className="flex gap-2.5">
                    <Avatar src={comment.author?.avatar_url} name={name} size="xs" />
                    <div className="bg-surface border-border min-w-0 flex-1 border px-3 py-2 text-xs">
                      <p className="flex items-center justify-between">
                        <span className="text-fg font-semibold">{name}</span>
                        <span className="text-2xs text-fg-subtle">
                          {formatRelative(comment.created_at)}
                        </span>
                      </p>
                      <p className="text-fg-muted mt-1 leading-relaxed whitespace-pre-line">
                        {comment.content}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </article>
  );
}
