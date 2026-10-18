"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, CornerUpRight } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import type { CommentWithAuthor } from "@/lib/salons/types";
import { formatRelative } from "@/lib/social/time";

import { CommentReplyControl } from "./comment-reply-control";

function flattenComments(comments: CommentWithAuthor[]) {
  const messages: CommentWithAuthor[] = [];
  const visit = (comment: CommentWithAuthor) => {
    messages.push(comment);
    comment.replies.forEach(visit);
  };
  comments.forEach(visit);
  return messages.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

function countReplies(comment: CommentWithAuthor): number {
  return comment.replies.reduce((total, reply) => total + 1 + countReplies(reply), 0);
}

export function CommentThreadList({
  comments,
  postId,
  salonId,
  currentUserId,
}: {
  comments: CommentWithAuthor[];
  postId: string;
  salonId: string;
  currentUserId: string | null;
}) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const discussionMessages = useMemo(() => flattenComments(comments), [comments]);
  const commentsById = useMemo(
    () => new Map(discussionMessages.map((comment) => [comment.id, comment])),
    [discussionMessages],
  );

  const isHiddenByCollapsedAncestor = (comment: CommentWithAuthor) => {
    let ancestorId = comment.parent_id;
    while (ancestorId) {
      if (collapsedIds.has(ancestorId)) return true;
      ancestorId = commentsById.get(ancestorId)?.parent_id ?? null;
    }
    return false;
  };

  return (
    <ul className="flex flex-col gap-3">
      {discussionMessages.map((comment) => {
        if (isHiddenByCollapsedAncestor(comment)) return null;

        const name = comment.author?.display_name ?? "Membre du salon";
        const isOwnComment = Boolean(currentUserId && comment.author_id === currentUserId);
        const replyCount = countReplies(comment);
        const isCollapsed = collapsedIds.has(comment.id);

        return (
          <li key={comment.id} className="flex min-w-0 items-start gap-2.5">
            <Avatar src={comment.author?.avatar_url} name={name} size="xs" />
            <div className="min-w-0 flex-1">
              <div
                className={`border-border/60 rounded-2xl border px-3.5 py-3 sm:px-4 ${
                  isOwnComment ? "bg-primary/10" : "bg-surface-raised"
                }`}
              >
                <p className="text-fg text-xs font-semibold">{isOwnComment ? "Vous" : name}</p>
                {comment.parent_id ? (
                  <p className="text-primary mt-1 flex items-center gap-1.5 text-xs font-medium">
                    <CornerUpRight className="size-3.5 shrink-0" aria-hidden="true" />
                    En réponse à{" "}
                    {commentsById.get(comment.parent_id)?.author?.display_name ?? "un commentaire"}
                  </p>
                ) : null}
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">
                  {comment.content}
                </p>
                <p className="text-fg-subtle text-2xs mt-1.5 text-right">
                  {formatRelative(comment.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-1">
                <CommentReplyControl
                  postId={postId}
                  parentId={comment.id}
                  salonId={salonId}
                  parentAuthor={name}
                  isAuthenticated={Boolean(currentUserId)}
                />
                {replyCount > 0 ? (
                  <button
                    type="button"
                    aria-expanded={!isCollapsed}
                    onClick={() =>
                      setCollapsedIds((current) => {
                        const next = new Set(current);
                        if (next.has(comment.id)) next.delete(comment.id);
                        else next.add(comment.id);
                        return next;
                      })
                    }
                    className="text-fg-muted hover:bg-bg-muted hover:text-primary inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronDown className="size-3.5" aria-hidden="true" />
                    ) : (
                      <ChevronUp className="size-3.5" aria-hidden="true" />
                    )}
                    {isCollapsed ? `Afficher les réponses (${replyCount})` : "Masquer les réponses"}
                  </button>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
