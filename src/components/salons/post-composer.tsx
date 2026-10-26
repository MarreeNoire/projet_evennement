"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  Eye,
  ImageIcon,
  LoaderCircle,
  Megaphone,
  PenLine,
  Pin,
  Plus,
  X,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  compressImage,
  type CompressedImage,
} from "@/components/salons/compress-image";
import {
  CATEGORY_LABELS,
  POST_CATEGORY_ORDER,
  type ViewerInfo,
} from "@/components/salons/salon-shared";
import { createPost, createSalonPoll, setPostPinned } from "@/lib/salons/actions";
import { LIMITS, STORAGE_BUCKETS } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { haptic } from "@/lib/ui/haptics";
import { cn } from "@/lib/utils";
import type { SalonPostCategory } from "@/types/database";

/* =============================================================================
   Composer de publication
   --------------------------------------------------------------------------
   Desktop (≥ md) : zone « Quoi de neuf ? » en tête de fil, qui s'agrandit.
   Mobile         : bouton flottant « + » ouvrant une feuille de saisie.
   Fonctions : texte, plusieurs images (aperçu, réordonner, compression
   client, progression d'envoi), sondage (2 à 6 choix), annonce + épinglage
   (organisateurs), brouillon automatique local, aperçu avant publication.
   ========================================================================== */

const DRAFT_PREFIX = "salon.composer.draft.v2";

interface DraftShape {
  content: string;
  category: SalonPostCategory;
  pollQuestion?: string;
  pollOptions?: string[];
}

interface PendingPhoto {
  id: string;
  file: File;
  previewUrl: string;
  status: "ready" | "uploading" | "done" | "error";
}

function readDraft(salonId: string): DraftShape | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${DRAFT_PREFIX}.${salonId}`);
    return raw ? (JSON.parse(raw) as DraftShape) : null;
  } catch {
    return null;
  }
}

export function PostComposer({
  salonId,
  viewer,
  allowMedia,
  canAnnounce,
}: {
  salonId: string;
  viewer: ViewerInfo;
  allowMedia: boolean;
  canAnnounce: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  /* Composeur inline sur le web, feuille tactile sur téléphone. */
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <>
      {/* Desktop : invitation à publier, puis éditeur inline (pas de modale). */}
      {open && isDesktop ? (
        <section
          aria-label="Nouvelle publication"
          className="bg-surface border-border overflow-hidden rounded-2xl border shadow-xs"
        >
          <PostEditor
            salonId={salonId}
            viewer={viewer}
            allowMedia={allowMedia}
            canAnnounce={canAnnounce}
            onDone={(pollCreated) => {
              setOpen(false);
              if (pollCreated) router.push(`/salons/${salonId}?tab=sondages`);
              else router.refresh();
            }}
          />
        </section>
      ) : (
        <section
          aria-label="Créer une publication"
          className="bg-surface border-border hidden rounded-2xl border p-3.5 shadow-xs md:flex md:items-center md:gap-3"
        >
          <Avatar src={viewer.avatarUrl} name={viewer.name} size="md" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="border-border bg-surface-sunken text-fg-subtle hover:bg-bg-subtle min-h-11 flex-1 rounded-full border px-4 py-2.5 text-left text-sm transition-colors hover:text-fg-muted"
          >
            Quoi de neuf{viewer.name ? `, ${viewer.name.split(" ")[0]}` : ""} ?
          </button>
          {allowMedia ? (
            <span
              className="text-primary border-primary/25 inline-flex size-11 items-center justify-center rounded-full border font-semibold"
              aria-hidden="true"
            >
              <ImageIcon className="size-4.5" />
            </span>
          ) : null}
        </section>
      )}

      {/* Mobile : bouton flottant, calé sur la barre d'onglets + zone sûre. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Créer une publication"
        className="bg-primary-solid text-primary-solid-fg press fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 inline-flex size-14 items-center justify-center rounded-full shadow-xl transition-transform duration-200 active:scale-90 md:hidden"
      >
        <Plus className="size-6" aria-hidden="true" />
      </button>

      {open && !isDesktop ? (
        <BottomSheet
          open={open}
          onClose={() => setOpen(false)}
          title="Nouvelle publication"
          closeLabel="Fermer le composeur"
        >
          <PostEditor
            salonId={salonId}
            viewer={viewer}
            allowMedia={allowMedia}
            canAnnounce={canAnnounce}
            onDone={(pollCreated) => {
              setOpen(false);
              if (pollCreated) router.push(`/salons/${salonId}?tab=sondages`);
              else router.refresh();
            }}
          />
        </BottomSheet>
      ) : null}
    </>
  );
}

/* ------------------------------ Éditeur ------------------------------------ */

export function PostEditor({
  salonId,
  viewer,
  allowMedia,
  canAnnounce,
  onDone,
}: {
  salonId: string;
  viewer: ViewerInfo;
  allowMedia: boolean;
  canAnnounce: boolean;
  onDone: (pollCreated: boolean) => void;
}) {
  const storedDraft = useMemo(() => readDraft(salonId), [salonId]);
  const [content, setContent] = useState(storedDraft?.content ?? "");
  const [category, setCategory] = useState<SalonPostCategory>(
    storedDraft?.category ?? "discussion",
  );
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [pinAfter, setPinAfter] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPoll, setShowPoll] = useState(Boolean(storedDraft?.pollQuestion));
  const [pollQuestion, setPollQuestion] = useState(storedDraft?.pollQuestion ?? "");
  const [pollOptions, setPollOptions] = useState<string[]>(
    storedDraft?.pollOptions?.length ? storedDraft.pollOptions : ["", ""],
  );
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Brouillon automatique (texte + catégorie + sondage). */
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      const draft: DraftShape = {
        content,
        category,
        pollQuestion: showPoll ? pollQuestion : undefined,
        pollOptions: showPoll ? pollOptions : undefined,
      };
      try {
        window.localStorage.setItem(
          `${DRAFT_PREFIX}.${salonId}`,
          JSON.stringify(draft),
        );
      } catch {
        /* quota : le brouillon reste en mémoire */
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [content, category, showPoll, pollQuestion, pollOptions, salonId]);

  const cleanDraft = useCallback(() => {
    try {
      window.localStorage.removeItem(`${DRAFT_PREFIX}.${salonId}`);
    } catch {
      /* rien à nettoyer de façon bloquante */
    }
  }, [salonId]);

  /* Photo ajoutée : compression immédiate côté client */
  const addPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const slots = Array.from(files).slice(0, 4 - photos.length);
    let blocked = false;
    const prepared: PendingPhoto[] = [];
    for (const file of slots) {
      if (file.size > LIMITS.MAX_PHOTO_BYTES) {
        blocked = true;
        continue;
      }
      const compressed: CompressedImage = await compressImage(file);
      prepared.push({
        id: `${file.name}-${Date.now()}-${prepared.length}`,
        file: compressed.file,
        previewUrl: URL.createObjectURL(compressed.file),
        status: "ready",
      });
    }
    setPhotos((prev) => prev.concat(prepared));
    if (blocked) setError("Chaque photo doit faire moins de 10 Mo.");
  };

  const movePhoto = (index: number, delta: -1 | 1) => {
    setPhotos((prev) => {
      const next = [...prev];
      const target = index + delta;
      const current = next[index];
      const other = next[target];
      if (!current || !other || target < 0 || target >= next.length) return prev;
      next[index] = other;
      next[target] = current;
      return next;
    });
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const item = prev.find((photo) => photo.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((photo) => photo.id !== id);
    });
  };

  /* Soumission : upload des photos puis publication (+ sondage). */
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = content.trim();
    if (!text || submittingRef.current) return;

    const wantsPoll = showPoll && (pollQuestion.trim() || pollOptions.some(Boolean));
    if (wantsPoll) {
      const options = pollOptions.map((option) => option.trim()).filter(Boolean);
      if (!pollQuestion.trim() || options.length < 2) {
        setError("Un sondage demande une question et au moins 2 choix.");
        return;
      }
    }

    setError(null);
    submittingRef.current = true;
    setSubmitting(true);

    try {
    /* 1. Photos : préparation + envoi séquentiel avec progression */
    const uploaded: { storage_path: string; size_bytes: number }[] = [];
    if (allowMedia && photos.length > 0) {
      const client = createSupabaseBrowserClient();
      for (let index = 0; index < photos.length; index += 1) {
        const photo = photos[index];
        if (!photo) continue;
        setPhotos((prev) =>
          prev.map((item) => (item.id === photo.id ? { ...item, status: "uploading" } : item)),
        );
        setUploadProgress(`Envoi de la photo ${index + 1} sur ${photos.length}…`);
        const ext = photo.file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${salonId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await client.storage
          .from(STORAGE_BUCKETS.SALON_PHOTOS)
          .upload(path, photo.file, { cacheControl: "3600", upsert: false });
        if (uploadError) {
          setPhotos((prev) =>
            prev.map((item) => (item.id === photo.id ? { ...item, status: "error" } : item)),
          );
          setUploadProgress(null);
          setError("Une photo n’a pas pu être envoyée. Réessaie ou retire-la du message.");
          return;
        }
        setPhotos((prev) =>
          prev.map((item) => (item.id === photo.id ? { ...item, status: "done" } : item)),
        );
        uploaded.push({ storage_path: path, size_bytes: photo.file.size });
      }
    }

    /* 2. Publication */
    setUploadProgress("Publication en cours…");
    const result = await createPost(
      salonId,
      text,
      uploaded,
      category,
      isAnnouncement && canAnnounce ? { kind: "announcement" } : {},
    );
    if (!result.success) {
      setUploadProgress(null);
      setError(result.error ?? "La publication n’a pas pu être créée. Réessaie.");
      return;
    }

    /* 3. Options secondaires : épingler, sondage */
    if (pinAfter && canAnnounce && result.postId) {
      /* meilleur effort : l'épinglage ne bloque pas la publication */
      void setPostPinned(result.postId, true);
    }
    let pollCreated = false;
    if (wantsPoll && pollQuestion.trim()) {
      try {
        const pollResult = await createSalonPoll(
          salonId,
          pollQuestion,
          pollOptions.map((option) => option.trim()).filter(Boolean),
        );
        pollCreated = pollResult.success;
        if (!pollResult.success) {
          setError(
            `La publication est créée, mais pas le sondage : ${pollResult.error ?? "réessaie depuis l’onglet Sondages."}`,
          );
        }
      } catch {
        setError(
          "La publication est créée, mais le sondage n’a pas pu être enregistré. Tu peux le créer depuis l’onglet Sondages.",
        );
      }
      if (!pollCreated) {
        setContent("");
        photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
        setPhotos([]);
        cleanDraft();
      }
    }

    setSubmitting(false);
    setUploadProgress(null);
    cleanDraft();
    photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    setContent("");
    setPhotos([]);
    setPollQuestion("");
    setPollOptions(["", ""]);
    setShowPoll(false);
    setIsAnnouncement(false);
    setPinAfter(false);
    haptic("light");
    if (pollCreated) onDone(true);
    else if (!wantsPoll) onDone(false);
    } catch {
      setError("La publication n’a pas pu être terminée. Vérifie le fil avant de réessayer.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  const categories = useMemo(() => POST_CATEGORY_ORDER.map((key) => ({ value: key, ...{ label: CATEGORY_LABELS[key] } })), []);

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <Avatar src={viewer.avatarUrl} name={viewer.name} size="md" />
        <div className="min-w-0">
          <p className="text-fg text-sm font-semibold">{viewer.name}</p>
          <p className="text-fg-subtle text-xs">Publication dans le salon</p>
        </div>
        {showPreview ? (
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className="text-fg-muted ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-bg-muted"
          >
            <PenLine className="size-3.5" aria-hidden="true" /> Éditer
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="text-fg-muted ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-bg-muted"
          >
            <Eye className="size-3.5" aria-hidden="true" /> Aperçu
          </button>
        )}
      </div>

      {showPreview ? (
        <div className="bg-bg-subtle border-border rounded-xl border p-3.5">
          <p className="text-fg-muted mb-1.5 text-2xs font-bold tracking-[0.08em] uppercase">
            Aperçu avant publication
          </p>
          <p className="text-fg text-[15px] leading-relaxed whitespace-pre-line">
            {content.trim() || "Ton texte apparaîtra ici…"}
          </p>
          {photos.length > 0 ? (
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.previewUrl}
                  alt=""
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ))}
            </div>
          ) : null}
          {showPoll && pollQuestion.trim() ? (
            <p className="text-fg-muted mt-2 inline-flex items-center gap-1.5 text-xs font-semibold">
              <BarChart3 className="size-3.5" aria-hidden="true" /> Sondage : {pollQuestion}
            </p>
          ) : null}
          {isAnnouncement ? (
            <p className="bg-accent-subtle text-accent-subtle-fg mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-bold uppercase">
              <Megaphone className="size-3" aria-hidden="true" /> Annonce officielle
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value.slice(0, LIMITS.MAX_POST_LENGTH))}
            rows={4}
            required
            dir="auto"
            aria-label="Texte de la publication"
            placeholder="Écris ton message… (info, question, annonce…)"
            className="border-border bg-surface-sunken focus:border-border-focus text-fg placeholder:text-fg-subtle w-full resize-y rounded-xl border px-3.5 py-3 text-base leading-relaxed outline-none md:text-[15px]"
          />
          <div className="text-fg-subtle text-right text-2xs tabular-nums">
            {content.length}/{LIMITS.MAX_POST_LENGTH}
          </div>
        </>
      )}

      {/* Étiquette */}
      <div>
        <p className="eyebrow mb-1.5">Étiquette</p>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              aria-pressed={category === item.value}
              className={cn(
                "press rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                category === item.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-fg-muted hover:text-fg",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Photos */}
      {allowMedia ? (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="eyebrow">Photos ({photos.length}/4)</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-primary inline-flex items-center gap-1.5 text-xs font-semibold"
              disabled={photos.length >= 4}
            >
              <Plus className="size-3.5" aria-hidden="true" /> Ajouter
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={LIMITS.ACCEPTED_IMAGE_TYPES.join(",")}
            multiple
            hidden
            onChange={(event) => {
              void addPhotos(event.target.files);
              event.target.value = "";
            }}
          />
          {photos.length > 0 ? (
            <ul className="grid grid-cols-4 gap-1.5">
              {photos.map((photo, index) => (
                <li key={photo.id} className="group relative">
                  <img
                    src={photo.previewUrl}
                    alt={`Aperçu photo ${index + 1}`}
                    className={cn(
                      "aspect-square w-full rounded-lg object-cover transition-opacity",
                      photo.status === "error" && "opacity-50",
                    )}
                  />
                  {photo.status !== "ready" ? (
                    <span className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-1 rounded-full bg-black/65 px-1 py-0.5 text-2xs font-bold text-white">
                      {photo.status === "uploading" ? (
                        <>
                          <LoaderCircle className="size-2.5 animate-spin" aria-hidden="true" /> en
                          envoi
                        </>
                      ) : photo.status === "done" ? (
                        <>
                          <Check className="size-2.5" aria-hidden="true" /> prête
                        </>
                      ) : (
                        "échec"
                      )}
                    </span>
                  ) : null}
                  <div className="absolute inset-x-0 top-1 flex justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => movePhoto(index, -1)}
                      aria-label="Déplacer à gauche"
                      disabled={index === 0}
                      className="bg-black/60 text-white rounded-full p-0.5 disabled:opacity-30"
                    >
                      <ArrowLeft className="size-3" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => movePhoto(index, 1)}
                      aria-label="Déplacer à droite"
                      disabled={index === photos.length - 1}
                      className="bg-black/60 text-white rounded-full p-0.5 disabled:opacity-30"
                    >
                      <ArrowRight className="size-3" aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    aria-label={`Retirer la photo ${index + 1}`}
                    className="bg-black/60 text-white absolute top-1 right-1 rounded-full p-0.5"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-border text-fg-subtle hover:bg-bg-subtle hover:text-fg-muted flex min-h-20 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-xs font-medium transition-colors"
            >
              <ImageIcon className="size-5" aria-hidden="true" />
              Ajouter des photos (compressées automatiquement)
            </button>
          )}
        </div>
      ) : null}

      {/* Sondage */}
      <div>
        <label className="eyebrow inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={showPoll}
            onChange={(event) => setShowPoll(event.target.checked)}
            className="accent-primary size-4"
          />
          Joindre un sondage
        </label>
        {showPoll ? (
          <div className="bg-bg-subtle border-border mt-2 flex flex-col gap-2 rounded-xl border p-3">
            <input
              value={pollQuestion}
              onChange={(event) => setPollQuestion(event.target.value.slice(0, 280))}
              placeholder="Ta question…"
              aria-label="Question du sondage"
              className="text-fg placeholder:text-fg-subtle bg-surface w-full rounded-lg border border-border px-3 py-2 text-base outline-none md:text-sm"
            />
            {pollOptions.map((option, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <input
                  value={option}
                  onChange={(event) => {
                    setPollOptions((prev) => {
                      const next = [...prev];
                      const slot = next[index];
                      if (slot === undefined) return prev;
                      next[index] = event.target.value.slice(0, 120);
                      return next;
                    });
                  }}
                  maxLength={120}
                  placeholder={`Choix ${index + 1}`}
                  aria-label={`Choix ${index + 1}`}
                  className="text-fg placeholder:text-fg-subtle bg-surface min-h-10 w-full rounded-lg border border-border px-3 text-base outline-none md:text-sm"
                />
                {pollOptions.length > 2 ? (
                  <button
                    type="button"
                    onClick={() => setPollOptions((prev) => prev.filter((_, i) => i !== index))}
                    aria-label={`Retirer le choix ${index + 1}`}
                    className="text-fg-muted hover:text-danger p-1.5"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            ))}
            {pollOptions.length < 6 ? (
              <button
                type="button"
                onClick={() => setPollOptions((prev) => [...prev, ""])}
                className="text-primary inline-flex w-fit items-center gap-1 text-xs font-semibold"
              >
                <Plus className="size-3.5" aria-hidden="true" /> Ajouter un choix
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Options organisateur */}
      {canAnnounce ? (
        <div className="bg-accent-subtle/60 border-accent-subtle-fg/25 flex flex-col gap-2 rounded-xl border p-3">
          <label className="text-accent-subtle-fg inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={isAnnouncement}
              onChange={(event) => setIsAnnouncement(event.target.checked)}
              className="accent-primary size-4"
            />
            <Megaphone className="size-4" aria-hidden="true" /> Publier comme annonce
          </label>
          <label className="text-accent-subtle-fg inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={pinAfter}
              onChange={(event) => setPinAfter(event.target.checked)}
              className="accent-primary size-4"
            />
            <Pin className="size-4" aria-hidden="true" /> Épingler en haut du fil
          </label>
        </div>
      ) : null}

      {uploadProgress ? (
        <p
          role="status"
          className="text-fg-muted bg-bg-subtle flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
        >
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
          {uploadProgress}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-lg px-3 py-2 text-xs font-semibold">
          {error}
        </p>
      ) : null}

      <div className="bg-surface sticky bottom-0 flex justify-end gap-2 pt-2 pb-1">
        <button
          type="button"
          onClick={() => onDone(false)}
          disabled={submitting}
          className="text-fg-muted hover:bg-bg-muted min-h-11 rounded-lg px-4 text-sm font-semibold disabled:opacity-60"
        >
          {submitting ? "Envoi…" : "Fermer"}
        </button>
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="bg-primary-solid text-primary-solid-fg press inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold disabled:opacity-50"
        >
          {submitting ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          Publier
        </button>
      </div>
    </form>
  );
}
