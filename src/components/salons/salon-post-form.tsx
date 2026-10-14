"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, LoaderCircle, Send } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Alert } from "@/components/ui/states";
import { PhaseTag } from "@/components/social/phase-tag";
import { createPost } from "@/lib/salons/actions";
import { LIMITS, STORAGE_BUCKETS } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
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
  allowMedia = true,
}: {
  salonId: string;
  author: { name: string; avatarUrl: string | null };
  phase?: EventPhase;
  allowMedia?: boolean;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [photos, setPhotos] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => photos.map((photo) => URL.createObjectURL(photo)), [photos]);

  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!content.trim()) {
      setError("Écris un message avant de publier.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const uploaded: { storage_path: string; size_bytes: number }[] = [];
        if (photos.length) {
          const supabase = createSupabaseBrowserClient();
          for (const photo of photos) {
            const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
            const storage_path = `${salonId}/${crypto.randomUUID()}.${extension}`;
            const { error: uploadError } = await supabase.storage
              .from(STORAGE_BUCKETS.SALON_PHOTOS)
              .upload(storage_path, photo, { contentType: photo.type, upsert: false });
            if (uploadError) throw new Error(uploadError.message);
            uploaded.push({ storage_path, size_bytes: photo.size });
          }
        }
        const result = await createPost(salonId, content.trim(), uploaded);
        if (result.success) {
          setContent("");
          setPhotos([]);
          if (inputRef.current) inputRef.current.value = "";
          router.refresh();
        } else {
          setError(result.error || "Impossible de publier ton message.");
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Erreur inattendue lors de la publication.",
        );
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={pending}
      className="border-border bg-surface mb-6 rounded-2xl border p-4 shadow-sm sm:p-5"
    >
      {error ? (
        <div className="mb-4">
          <Alert tone="danger" title="Publication impossible">
            {error}
          </Alert>
        </div>
      ) : null}

      <div className="flex gap-3 sm:gap-4">
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
            rows={4}
            placeholder="Partage une question, une idée ou un moment de l’événement…"
            className="placeholder:text-fg-subtle min-h-28 w-full resize-y bg-transparent text-base leading-relaxed focus:outline-none"
          />

          <div className="border-border/60 mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                className="sr-only"
                aria-label="Choisir des photos"
                onChange={(event) => {
                  const selected = Array.from(event.target.files ?? []);
                  const valid = selected.filter(
                    (file) => file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024,
                  );
                  if (valid.length !== selected.length)
                    setError("Choisis des images de 10 Mo maximum.");
                  setPhotos((current) => [...current, ...valid].slice(0, 4));
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={!allowMedia || pending || photos.length >= 4}
                onClick={() => inputRef.current?.click()}
                title={
                  !allowMedia
                    ? "L'envoi de photos est désactivé pour cet événement"
                    : "Ajouter des photos"
                }
                className="text-fg-muted hover:bg-bg-muted hover:text-fg border-border inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ImageIcon className="size-4" aria-hidden="true" />
                {photos.length ? `Photos ${photos.length}/4` : "Ajouter des photos"}
              </button>
              {phase ? <PhaseTag phase={phase} /> : null}
            </div>

            <div className="ml-auto flex items-center gap-3">
              <span className="text-fg-subtle text-xs tabular-nums" aria-live="polite">
                {content.length}/{LIMITS.MAX_POST_LENGTH}
              </span>
              <button
                type="submit"
                disabled={pending || content.trim().length === 0}
                aria-busy={pending}
                className="bg-primary-solid hover:bg-primary-solid-hover text-primary-solid-fg inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold shadow-sm transition-colors disabled:cursor-progress disabled:opacity-60"
              >
                {pending ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-3.5" aria-hidden="true" />
                )}
                {pending ? "Publication…" : "Publier"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {photos.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <li
              key={`${photo.name}-${index}`}
              className="border-border bg-bg-muted relative aspect-square overflow-hidden border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previews[index]}
                alt={`Aperçu ${index + 1}`}
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))}
                className="border-border bg-surface/95 hover:bg-surface absolute top-2 right-2 min-h-10 rounded-full border px-3 text-xs font-semibold shadow-sm"
                aria-label={`Retirer la photo ${index + 1}`}
              >
                Retirer
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
