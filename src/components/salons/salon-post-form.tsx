"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Send } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Alert } from "@/components/ui/states";
import { PhaseTag } from "@/components/social/phase-tag";
import { createPost } from "@/lib/salons/actions";
import { LIMITS } from "@/lib/constants";
import { STORAGE_BUCKETS } from "@/lib/constants";
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
    <form onSubmit={handleSubmit} className="border-border bg-surface mb-6 rounded-sm border p-4">
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
            className="placeholder:text-fg-subtle w-full resize-none bg-transparent text-base leading-relaxed focus:outline-none"
          />

          <div className="border-border/60 mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
            <div className="flex items-center gap-3">
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
                className="text-fg-subtle hover:bg-bg-muted inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium"
              >
                <ImageIcon className="size-4" aria-hidden="true" />
                Photo
              </button>
              {photos.length > 0 ? (
                <span className="text-fg-muted text-xs">{photos.length}/4 photos</span>
              ) : null}
              {phase ? <PhaseTag phase={phase} /> : null}
            </div>

            <div className="flex items-center gap-3">
              {remaining < 500 ? (
                <span className="text-fg-subtle text-xs tabular-nums">{remaining}</span>
              ) : null}
              <button
                type="submit"
                disabled={pending || content.trim().length === 0}
                className="bg-primary hover:bg-primary-hover inline-flex h-9 items-center gap-2 rounded-md px-5 text-xs font-semibold text-white shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "Publication…" : "Publier"}
                <Send className="size-3.5" aria-hidden="true" />
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
                className="border-border bg-surface absolute top-1 right-1 border px-2 py-1 text-xs font-semibold"
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
