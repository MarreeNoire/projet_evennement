import Link from "next/link";
import { BadgeCheck, CornerUpRight, MessageCircle, Megaphone } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import type { CommentWithAuthor, PostWithAuthor } from "@/lib/salons/types";
import { formatRelative } from "@/lib/social/time";

import { PostEditControl } from "./post-edit-control";
import { PostActions } from "./post-actions";
import { CommentReplyControl } from "./comment-reply-control";

const CATEGORY_LABELS: Record<string, string> = {
  discussion: "Discussion",
  question: "Question",
  info_pratique: "Info pratique",
  rencontre: "Rencontre",
  covoiturage: "Covoiturage",
  photo: "Photo",
};

function flattenComments(comments: CommentWithAuthor[]) {
  const messages: CommentWithAuthor[] = [];
  const visit = (comment: CommentWithAuthor) => {
    messages.push(comment);
    comment.replies.forEach(visit);
  };
  comments.forEach(visit);
  return messages.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

function CommentMessage({
  comment,
  parentAuthor,
  postId,
  salonId,
  currentUserId,
}: {
  comment: CommentWithAuthor;
  parentAuthor: string | null;
  postId: string;
  salonId: string;
  currentUserId: string | null;
}) {
  const name = comment.author?.display_name ?? "Membre du salon";
  const isOwnComment = Boolean(currentUserId && comment.author_id === currentUserId);

  return (
    <li className="flex min-w-0 items-start gap-2.5">
      <Avatar src={comment.author?.avatar_url} name={name} size="xs" />
      <div className="min-w-0 flex-1">
        <div
          className={`border-border/60 rounded-2xl border px-3.5 py-3 sm:px-4 ${
            isOwnComment ? "bg-primary/10" : "bg-surface-raised"
          }`}
        >
          <p className="text-fg text-xs font-semibold">{isOwnComment ? "Vous" : name}</p>
          {parentAuthor ? (
            <p className="text-primary mt-1 flex items-center gap-1.5 text-xs font-medium">
              <CornerUpRight className="size-3.5 shrink-0" aria-hidden="true" />
              En réponse à {parentAuthor}
            </p>
          ) : null}
          <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">{comment.content}</p>
          <p className="text-fg-subtle text-2xs mt-1.5 text-right">
            {formatRelative(comment.created_at)}
          </p>
        </div>
        <CommentReplyControl
          postId={postId}
          parentId={comment.id}
          salonId={salonId}
          parentAuthor={name}
          isAuthenticated={Boolean(currentUserId)}
        />
      </div>
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
  const discussionMessages = flattenComments(comments);
  const commentsById = new Map(discussionMessages.map((comment) => [comment.id, comment]));

  return (
    <article className="post-card group border-border bg-surface hover:border-border-strong mb-4 w-full rounded-2xl border px-4 py-5 shadow-sm transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:shadow-md sm:px-6 sm:py-6">
      <header className="mb-3 flex min-w-0 items-start gap-3">
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

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
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
        </div>
      </header>

      <span className="bg-primary/10 text-primary text-2xs inline-flex rounded-full px-2.5 py-1 font-semibold">
        {CATEGORY_LABELS[post.category] ?? "Discussion"}
      </span>

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
        <p className="text-fg mt-2 text-base leading-relaxed whitespace-pre-line">{post.content}</p>
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

      {comments.length > 0 ? (
        <section
          aria-label="Discussion de la publication"
          className="bg-bg-subtle border-border mt-4 rounded-2xl border p-3 sm:p-4"
        >
          <div className="text-fg-muted mb-3 flex items-center gap-2 text-xs font-semibold">
            <MessageCircle className="text-primary size-4" aria-hidden="true" />
            Discussion
            <span className="text-fg-subtle font-normal">
              · {discussionMessages.length} message{discussionMessages.length === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="flex flex-col gap-3">
            {discussionMessages.map((comment) => (
              <CommentMessage
                key={comment.id}
                comment={comment}
                parentAuthor={
                  comment.parent_id
                    ? (commentsById.get(comment.parent_id)?.author?.display_name ??
                      "un commentaire")
                    : null
                }
                postId={post.id}
                salonId={post.salon_id}
                currentUserId={currentUserId}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <PostActions
        postId={post.id}
        reactionCount={post.reaction_count ?? 0}
        commentCount={post.comment_count ?? comments.length}
        hasReacted={post.has_reacted}
      />
    </article>
  );
}
