"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, Reply, Send, X } from "lucide-react";

import { createComment } from "@/lib/salons/actions";

export function CommentReplyControl({
  postId,
  parentId,
  salonId,
  parentAuthor,
  isAuthenticated,
}: {
  postId: string;
  parentId: string;
  salonId: string;
  parentAuthor: string;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!isAuthenticated) {
    return (
      <Link
        href={`/connexion?redirect=${encodeURIComponent(`/salons/${salonId}?tab=fil`)}`}
        className="text-primary hover:bg-primary/10 inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 text-xs font-semibold"
      >
        <Reply className="size-3.5" aria-hidden="true" /> Se connecter pour répondre
      </Link>
    );
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = content.trim();
    if (!normalized) return;

    setError(null);
    startTransition(async () => {
      const result = await createComment(postId, normalized, parentId);
      if (!result.success) {
        setError(result.error ?? "La réponse n’a pas pu être envoyée.");
        return;
      }

      setContent("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="mt-1">
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
          aria-expanded={open}
          className="text-fg-muted hover:bg-bg-muted hover:text-primary inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 text-xs font-semibold transition-colors"
        >
          <Reply className="size-3.5" aria-hidden="true" /> Répondre
        </button>
      ) : (
        <form onSubmit={submit} className="mt-2 grid gap-2">
          <label htmlFor={`reply-comment-${parentId}`} className="text-fg-muted text-xs">
            Répondre à <span className="font-semibold">{parentAuthor}</span>
          </label>
          <textarea
            id={`reply-comment-${parentId}`}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={2000}
            rows={2}
            required
            disabled={pending}
            autoFocus
            placeholder="Écris ta réponse…"
            className="border-border-strong bg-surface focus:border-border-focus focus:ring-border-focus min-h-20 w-full resize-y rounded-lg border px-3 py-2 text-sm leading-relaxed focus:ring-1 focus:outline-none"
          />
          {error ? (
            <p role="alert" className="text-danger text-xs">
              {error}
            </p>
          ) : null}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              disabled={pending}
              className="text-fg-muted hover:bg-bg-muted inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-xs font-semibold"
            >
              <X className="size-3.5" aria-hidden="true" /> Annuler
            </button>
            <button
              type="submit"
              disabled={pending || !content.trim()}
              aria-busy={pending}
              className="bg-primary-solid text-primary-solid-fg hover:bg-primary-solid-hover inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold disabled:opacity-50"
            >
              {pending ? (
                <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-3.5" aria-hidden="true" />
              )}
              {pending ? "Envoi…" : "Répondre"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
