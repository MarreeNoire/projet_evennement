"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, LoaderCircle, Send, X } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { createPost } from "@/lib/salons/actions";
import { LIMITS, STORAGE_BUCKETS } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PHASE_LABELS, type EventPhase } from "@/lib/social/phase";
import type { SalonPostCategory } from "@/types/database";

const POST_CATEGORIES: { value: SalonPostCategory; label: string }[] = [
  { value: "discussion", label: "Discussion" },
  { value: "question", label: "Question" },
  { value: "info_pratique", label: "Info pratique" },
  { value: "rencontre", label: "Rencontre" },
  { value: "covoiturage", label: "Covoiturage" },
  { value: "photo", label: "Photo" },
];

/* =============================================================================
   Composeur du salon
   --------------------------------------------------------------------------
   Une seule ligne qui grandit avec le texte, comme un chat. La catégorie et
   les photos restent accessibles en un clic ; la phase d'arrivée est rappelée
   en texte discret pour savoir où la publication sera rangée.
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
  const [category, setCategory] = useState<SalonPostCategory>("discussion");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [photos, setPhotos] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const previews = useMemo(() => photos.map((photo) => URL.createObjectURL(photo)), [photos]);

  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;
    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
  }, [content]);

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
        const result = await createPost(salonId, content.trim(), uploaded, category);
        if (result.success) {
          setContent("");
          setCategory("discussion");
          setPhotos([]);
          if (inputRef.current) inputRef.current.value = "";
          router.refresh();
          requestAnimationFrame(() => textRef.current?.focus());
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
      className="border-border bg-surface mb-6 rounded-xl border p-3 sm:p-4"
    >
      <div className="flex gap-3">
        <Avatar src={author.avatarUrl} name={author.name} size="sm" className="mt-1" />
        <div className="min-w-0 flex-1">
          <label htmlFor="salon-post" className="sr-only">
            Ta publication
          </label>
          <textarea
            ref={textRef}
            id="salon-post"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            maxLength={LIMITS.MAX_POST_LENGTH}
            rows={1}
            placeholder="Quoi de neuf dans le salon ?"
            className="placeholder:text-fg-subtle min-h-9 w-full resize-none bg-transparent py-1.5 text-base leading-relaxed focus:outline-none"
          />

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <label className="sr-only" htmlFor="salon-post-category">
                Étiquette de la publication
              </label>
              <select
                id="salon-post-category"
                value={category}
                onChange={(event) => setCategory(event.target.value as SalonPostCategory)}
                className="border-border text-fg-muted focus:border-border-strong h-8 max-w-28 rounded-full border bg-transparent px-2.5 text-xs font-semibold outline-none"
              >
                {POST_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
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
                aria-label={
                  !allowMedia
                    ? "L'envoi de photos est désactivé pour cet événement"
                    : "Ajouter des photos"
                }
                title={
                  !allowMedia
                    ? "L'envoi de photos est désactivé pour cet événement"
                    : "Ajouter des photos"
                }
                className="text-fg-subtle hover:bg-bg-muted hover:text-fg flex size-8 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ImageIcon className="size-4" aria-hidden="true" />
              </button>
              {phase ? (
                <span className="text-fg-subtle hidden text-[11px] sm:inline">
                  · {PHASE_LABELS[phase]}
                </span>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {content.length > LIMITS.MAX_POST_LENGTH * 0.85 ? (
                <span className="text-fg-subtle text-2xs tabular-nums" aria-live="polite">
                  {content.length}/{LIMITS.MAX_POST_LENGTH}
                </span>
              ) : null}
              <button
                type="submit"
                disabled={pending || content.trim().length === 0}
                aria-busy={pending}
                aria-label={pending ? "Publication en cours" : "Publier"}
                title={pending ? "Publication…" : "Publier (Ctrl + Entrée)"}
                className="bg-primary-solid hover:bg-primary-solid-hover text-primary-solid-fg flex size-9 items-center justify-center rounded-full transition-[background-color,transform] duration-150 active:scale-95 disabled:cursor-progress disabled:opacity-40 motion-reduce:transform-none"
              >
                {pending ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {photos.length > 0 ? (
        <ul className="mt-3 ml-11 grid grid-cols-4 gap-2">
          {photos.map((photo, index) => (
            <li
              key={`${photo.name}-${index}`}
              className="border-border bg-bg-muted relative aspect-square overflow-hidden rounded-md border"
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
                className="border-border bg-surface/95 hover:bg-surface absolute top-1 right-1 flex size-6 items-center justify-center rounded-full border"
                aria-label={`Retirer la photo ${index + 1}`}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p role="alert" className="text-danger mt-2 text-xs font-medium">
          {error}
        </p>
      ) : null}
    </form>
  );
}
