import Link from "next/link";
import { BadgeCheck, Megaphone } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import type { CommentWithAuthor, PostWithAuthor } from "@/lib/salons/types";
import { formatRelative } from "@/lib/social/time";

import { PostEditControl } from "./post-edit-control";
import { PostActions } from "./post-actions";
import { CommentReplyControl } from "./comment-reply-control";

function CommentThread({
  comment,
  postId,
  salonId,
  currentUserId,
  depth = 0,
}: {
  comment: CommentWithAuthor;
  postId: string;
  salonId: string;
  currentUserId: string | null;
  depth?: number;
}) {
  const name = comment.author?.display_name ?? "Membre du salon";

  return (
    <li className="min-w-0">
      <div className="flex items-start gap-2.5">
        <Avatar src={comment.author?.avatar_url} name={name} size="xs" />
        <div className="min-w-0 flex-1">
          <div className="bg-surface border-border border px-3 py-2 text-xs">
            <p className="flex items-center justify-between gap-2">
              <span className="text-fg font-semibold">{name}</span>
              <span className="text-2xs text-fg-subtle shrink-0">
                {formatRelative(comment.created_at)}
              </span>
            </p>
            <p className="text-fg-muted mt-1 leading-relaxed whitespace-pre-line">
              {comment.content}
            </p>
          </div>
          {depth === 0 ? (
            <CommentReplyControl
              postId={postId}
              parentId={comment.id}
              salonId={salonId}
              parentAuthor={name}
              isAuthenticated={Boolean(currentUserId)}
            />
          ) : null}
        </div>
      </div>
      {comment.replies.length > 0 ? (
        <ul className="border-border mt-2 ml-5 flex flex-col gap-2 border-l pl-3 sm:ml-8 sm:pl-4">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              postId={postId}
              salonId={salonId}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

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
  currentUserId = null,
}: {
  post: PostWithAuthor;
  comments?: CommentWithAuthor[];
  currentUserId?: string | null;
}) {
  const authorName = post.author?.display_name ?? "Membre du salon";
  const isAnnouncement = post.kind === "announcement";
  const images = (Array.isArray(post.media) ? post.media : []).filter(
    (item) => item.kind === "image" && item.url,
  );

  return (
    <article className="post-card group border-border bg-surface hover:border-border-strong mb-4 rounded-2xl border px-4 py-5 shadow-sm transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:shadow-md sm:px-6 sm:py-6">
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
            {post.updated_at &&
            new Date(post.updated_at).getTime() > new Date(post.created_at).getTime() + 1000 ? (
              <span className="text-fg-subtle text-xs">· modifiée</span>
            ) : null}
            {post.is_pinned ? (
              <span className="bg-primary/10 text-2xs text-primary inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-bold">
                Épinglé
              </span>
            ) : null}
            {currentUserId && currentUserId === post.author?.id ? (
              <span className="ml-auto">
                <PostEditControl postId={post.id} content={post.content} />
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
                    className="size-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </li>
              ))}
            </ul>
          ) : null}

          <PostActions
            postId={post.id}
            reactionCount={post.reaction_count ?? 0}
            commentCount={post.comment_count ?? comments.length}
            hasReacted={post.has_reacted}
          />

          {comments.length > 0 ? (
            <ul className="bg-bg-subtle border-border mt-4 flex flex-col gap-2.5 border-y px-3 py-3">
              {comments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  postId={post.id}
                  salonId={post.salon_id}
                  currentUserId={currentUserId}
                />
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </article>
  );
}
