"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Pencil, X } from "lucide-react";

import { updateSalonPost } from "@/lib/salons/actions";
import { LIMITS } from "@/lib/constants";

export function PostEditControl({ postId, content }: { postId: string; content: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateSalonPost(postId, draft);
      if (!result.success) {
        setError(result.error ?? "La modification a échoué.");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(content);
          setError(null);
          setEditing(true);
        }}
        className="text-fg-muted hover:bg-bg-muted hover:text-fg inline-flex min-h-9 items-center gap-1.5 rounded-sm px-3 text-xs font-semibold transition-colors"
        aria-label="Modifier ma publication"
      >
        <Pencil className="size-3.5" aria-hidden="true" />
        Modifier
      </button>
    );
  }

  return (
    <form
      onSubmit={save}
      className="bg-bg-subtle border-border mt-4 grid gap-3 rounded-xl border p-3"
    >
      <label htmlFor={`edit-post-${postId}`} className="text-sm font-semibold">
        Modifier ta publication
      </label>
      <textarea
        id={`edit-post-${postId}`}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        maxLength={LIMITS.MAX_POST_LENGTH}
        rows={4}
        required
        disabled={pending}
        className="border-border-strong bg-surface focus:border-border-focus focus:ring-border-focus min-h-24 w-full resize-y rounded-lg border px-3 py-2.5 text-base leading-relaxed focus:ring-1 focus:outline-none"
      />
      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-fg-subtle text-xs tabular-nums">
          {draft.length}/{LIMITS.MAX_POST_LENGTH}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={pending}
            className="text-fg-muted hover:bg-bg-muted inline-flex min-h-10 items-center gap-1.5 rounded-sm px-3 text-xs font-semibold"
          >
            <X className="size-3.5" aria-hidden="true" /> Annuler
          </button>
          <button
            type="submit"
            disabled={pending || !draft.trim() || draft.trim() === content}
            className="bg-primary-solid text-primary-solid-fg hover:bg-primary-solid-hover inline-flex min-h-10 items-center gap-1.5 rounded-sm px-4 text-xs font-semibold disabled:opacity-50"
          >
            {pending ? (
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="size-3.5" aria-hidden="true" />
            )}
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </form>
  );
}
