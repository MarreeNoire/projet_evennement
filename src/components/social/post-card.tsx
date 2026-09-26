import Image from "next/image";
import Link from "next/link";
import { Megaphone } from "lucide-react";

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
    <article className="group mb-4 rounded-2xl border border-border/80 bg-surface p-4 sm:p-5 shadow-xs transition-all hover:border-border-strong hover:shadow-sm">
      <div className="flex items-start gap-3">
        {post.author ? (
          <Link href={`/profil/${post.author.id}`} aria-label={`Profil de ${authorName}`} className="shrink-0 transition-opacity hover:opacity-85">
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
                className="font-semibold text-fg hover:text-primary transition-colors"
              >
                {authorName}
              </Link>
            ) : (
              <span className="font-semibold text-fg">{authorName}</span>
            )}
            {post.author?.is_verified ? (
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary" title="Profil vérifié">
                ✓
              </span>
            ) : null}
            <span className="text-xs text-fg-subtle">· {formatRelative(post.created_at)}</span>
            {post.is_pinned ? (
              <span className="inline-flex items-center gap-1 rounded-sm bg-primary/10 px-2 py-0.5 text-2xs font-bold text-primary">
                Épinglé
              </span>
            ) : null}
          </header>

          {isAnnouncement ? (
            <div className="mt-3 rounded-xl border border-accent/20 bg-accent-subtle/80 p-3.5">
              <p className="flex items-center gap-1.5 text-2xs font-bold tracking-wider text-accent-subtle-fg uppercase">
                <Megaphone className="size-3.5" aria-hidden="true" />
                Annonce de l&apos;organisateur
              </p>
              <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-fg">
                {post.content}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-fg">
              {post.content}
            </p>
          )}

          {images.length > 0 ? (
            <ul className={`mt-3 grid gap-2 overflow-hidden rounded-xl ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {images.slice(0, 4).map((image) => (
                <li
                  key={image.url}
                  className="relative aspect-4/3 overflow-hidden bg-bg-muted"
                >
                  <Image
                    src={image.url}
                    alt={`Photo partagée par ${authorName}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 320px"
                    className="object-cover transition-transform duration-300 hover:scale-105"
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
            <ul className="mt-3 flex flex-col gap-2.5 rounded-xl bg-bg-subtle/60 p-3">
              {comments.map((comment) => {
                const name = comment.author?.display_name ?? "Membre du salon";
                return (
                  <li key={comment.id} className="flex gap-2.5">
                    <Avatar src={comment.author?.avatar_url} name={name} size="xs" />
                    <div className="min-w-0 flex-1 rounded-lg bg-surface px-3 py-2 text-xs shadow-2xs">
                      <p className="flex items-center justify-between">
                        <span className="font-semibold text-fg">{name}</span>
                        <span className="text-2xs text-fg-subtle">
                          {formatRelative(comment.created_at)}
                        </span>
                      </p>
                      <p className="mt-1 leading-relaxed whitespace-pre-line text-fg-muted">
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
