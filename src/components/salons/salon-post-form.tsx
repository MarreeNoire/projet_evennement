"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Send } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Alert } from "@/components/ui/states";
import { PhaseTag } from "@/components/social/phase-tag";
import { createPost } from "@/lib/salons/actions";
import { LIMITS } from "@/lib/constants";
import type { EventPhase } from "@/lib/social/phase";

/* =============================================================================
   Composeur du salon
   --------------------------------------------------------------------------
   Rappelle dans quelle phase (avant / sur place / après) la publication sera
   rangée, pour que l'auteur sache où elle apparaîtra dans le fil.
   ========================================================================== */

export function SalonPostForm({
  salonId,
  author,
  phase,
}: {
  salonId: string;
  author: { name: string; avatarUrl: string | null };
  phase?: EventPhase;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remaining = LIMITS.MAX_POST_LENGTH - content.length;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!content.trim()) {
      setError("Écris un message avant de publier.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const result = await createPost(salonId, content.trim());
        if (result.success) {
          setContent("");
          router.refresh();
        } else {
          setError(result.error || "Impossible de publier ton message.");
        }
      } catch {
        setError("Erreur inattendue lors de la publication.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-border/80 bg-surface p-4 shadow-xs">
      {error ? (
        <div className="mb-4">
          <Alert tone="danger" title="Publication impossible">
            {error}
          </Alert>
        </div>
      ) : null}

      <div className="flex gap-3">
        <Avatar src={author.avatarUrl} name={author.name} size="md" />
        <div className="min-w-0 flex-1">
          <label htmlFor="salon-post" className="sr-only">
            Ta publication
          </label>
          <textarea
            id="salon-post"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={LIMITS.MAX_POST_LENGTH}
            rows={3}
            placeholder="Quoi de neuf ? Pose une question, partage une info ou un bon plan..."
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed placeholder:text-fg-subtle focus:outline-none"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled
                title="L'envoi de photos arrive bientôt"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-fg-subtle hover:bg-bg-muted"
              >
                <ImageIcon className="size-4" aria-hidden="true" />
                Photo
              </button>
              {phase ? <PhaseTag phase={phase} /> : null}
            </div>

            <div className="flex items-center gap-3">
              {remaining < 500 ? (
                <span className="text-xs text-fg-subtle tabular-nums">{remaining}</span>
              ) : null}
              <button
                type="submit"
                disabled={pending || content.trim().length === 0}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "Publication…" : "Publier"}
                <Send className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
