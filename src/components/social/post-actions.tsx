"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, LoaderCircle, MessageCircle, Send } from "lucide-react";

import { createComment, toggleReaction } from "@/lib/salons/actions";
import { cn } from "@/lib/utils";

/* =============================================================================
   Actions de publication façon Réseau Social
   --------------------------------------------------------------------------
   Boutons d'interactions directs, compteur dynamique, action "J'aime" / Heart
   et réponse au fil.
   ========================================================================== */

export function PostActions({
  postId,
  reactionCount,
  commentCount,
  hasReacted,
}: {
  postId: string;
  reactionCount: number;
  commentCount: number;
  hasReacted: boolean;
}) {
  const router = useRouter();
  const [reacted, setReacted] = useState(hasReacted);
  const [count, setCount] = useState(reactionCount);
  const [replyOpen, setReplyOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleLike() {
    const next = !reacted;
    setReacted(next);
    setCount((value) => Math.max(0, value + (next ? 1 : -1)));
    setError(null);

    startTransition(async () => {
      const result = await toggleReaction("post", postId, "like");
      if (!result.success) {
        setReacted(!next);
        setCount((value) => Math.max(0, value + (next ? -1 : 1)));
        setError(result.error ?? "Impossible d'enregistrer ta réaction.");
      }
    });
  }

  function sendReply(event: React.FormEvent) {
    event.preventDefault();
    const content = reply.trim();
    if (!content) return;

    setError(null);
    startTransition(async () => {
      const result = await createComment(postId, content);
      if (result.success) {
        setReply("");
        setReplyOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? "Impossible d'envoyer ta réponse.");
      }
    });
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={toggleLike}
          disabled={pending}
          aria-pressed={reacted}
          aria-busy={pending}
          className={cn(
            "group inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-[color,background-color,transform] duration-150 hover:bg-bg-muted active:scale-95 disabled:cursor-progress disabled:opacity-70 motion-reduce:transform-none motion-reduce:transition-none",
            reacted ? "text-danger" : "text-fg-subtle hover:text-fg",
          )}
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Heart
              className={cn(
                "size-4 transition-transform duration-200 motion-reduce:transition-none",
                reacted && !pending && "animate-like-confirm",
                reacted && "scale-110 fill-current",
              )}
              aria-hidden="true"
            />
          )}
          <span>{pending ? "En cours…" : count > 0 ? count : "J'aime"}</span>
        </button>

        <button
          type="button"
          onClick={() => setReplyOpen((open) => !open)}
          aria-expanded={replyOpen}
          className="group text-fg-subtle hover:bg-bg-muted hover:text-fg inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-[color,background-color,transform] duration-150 active:scale-95 motion-reduce:transform-none motion-reduce:transition-none"
        >
          <MessageCircle
            className="size-4 transition-transform duration-200 group-hover:scale-110"
            aria-hidden="true"
          />
          <span>{commentCount > 0 ? commentCount : "Commenter"}</span>
        </button>
      </div>

      {replyOpen ? (
        <form
          onSubmit={sendReply}
          className="border-border bg-bg-subtle mt-2 flex items-end gap-2 rounded-lg border p-2"
        >
          <label htmlFor={`reply-${postId}`} className="sr-only">
            Ta réponse
          </label>
          <textarea
            id={`reply-${postId}`}
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Écrire un commentaire..."
            className="border-border bg-surface placeholder:text-fg-subtle focus:border-primary focus:ring-primary min-h-11 w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm focus:ring-1 focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending || reply.trim().length === 0}
            aria-label={pending ? "Envoi de la réponse" : "Envoyer la réponse"}
            aria-busy={pending}
            className="bg-primary-solid text-primary-solid-fg hover:bg-primary-solid-hover inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-sm px-4 text-xs font-semibold transition-[background-color,transform] duration-150 active:scale-95 disabled:cursor-progress disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none"
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-3.5" aria-hidden="true" />
            )}
          </button>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="text-danger mt-2 text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
