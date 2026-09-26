"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Send, Share2 } from "lucide-react";

import { createComment, toggleReaction } from "@/lib/salons/actions";
import { cn } from "@/lib/utils";

/* =============================================================================
   Actions de publication façon Réseau Social
   --------------------------------------------------------------------------
   Boutons d'interactions directs, compteur dynamique, action "J'aime" / Heart
   et partage en un clic.
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
  const [copied, setCopied] = useState(false);
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

  function handleShare() {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
    <div className="mt-3 pt-2">
      <div className="flex items-center justify-between border-t border-border/40 pt-2 text-sm">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleLike}
            aria-pressed={reacted}
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95",
              reacted
                ? "bg-danger-subtle text-danger"
                : "text-fg-muted hover:bg-bg-muted hover:text-fg",
            )}
          >
            <Heart
              className={cn(
                "size-4 transition-transform duration-200 group-hover:scale-110",
                reacted && "fill-current scale-110",
              )}
              aria-hidden="true"
            />
            <span>{count > 0 ? count : "J'aime"}</span>
          </button>

          <button
            type="button"
            onClick={() => setReplyOpen((open) => !open)}
            aria-expanded={replyOpen}
            className="group inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-fg-muted transition-all duration-150 hover:bg-bg-muted hover:text-fg active:scale-95"
          >
            <MessageCircle className="size-4 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
            <span>{commentCount > 0 ? commentCount : "Commenter"}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-fg-muted transition-all hover:bg-bg-muted hover:text-fg"
          title="Copier le lien"
        >
          <Share2 className="size-3.5" aria-hidden="true" />
          <span>{copied ? "Copié !" : "Partager"}</span>
        </button>
      </div>

      {replyOpen ? (
        <form onSubmit={sendReply} className="mt-3 flex items-start gap-2">
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
            className="min-h-10 w-full resize-none rounded-xl border border-border bg-surface-raised px-3.5 py-2 text-sm placeholder:text-fg-subtle focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending || reply.trim().length === 0}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="size-3.5" aria-hidden="true" />
          </button>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
