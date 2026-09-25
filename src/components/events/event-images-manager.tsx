"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Star, Trash2, X } from "lucide-react";

import { Alert } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LIMITS } from "@/lib/constants";
import { updateEventCoverAction, updateEventGalleryAction } from "@/lib/events/actions";
import { MAX_GALLERY_IMAGES, uploadEventCover } from "@/lib/events/upload-cover";
import { cn } from "@/lib/utils";

const ACCEPT = LIMITS.ACCEPTED_IMAGE_TYPES.join(",");

export interface PendingImage {
  file: File;
  previewUrl: string;
}

export function EventImagesManager({
  mode,
  eventId,
  initialCoverUrl,
  initialGallery,
  pendingCover,
  pendingGallery,
  onPendingCoverChange,
  onPendingGalleryChange,
}: {
  mode: "create" | "edit";
  eventId?: string;
  initialCoverUrl?: string | null;
  initialGallery?: string[];
  pendingCover?: PendingImage | null;
  pendingGallery?: PendingImage[];
  onPendingCoverChange?: (image: PendingImage | null) => void;
  onPendingGalleryChange?: (images: PendingImage[]) => void;
}) {
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl ?? null);
  const [gallery, setGallery] = useState<string[]>(initialGallery ?? []);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function checkFile(file: File): string | null {
    if (!(LIMITS.ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      return "Format non pris en charge : utilisez JPG, PNG, WebP ou AVIF.";
    }
    if (file.size > LIMITS.MAX_COVER_BYTES) {
      return "Image trop lourde : 5 Mo maximum par image.";
    }
    return null;
  }

  function readAsPreview(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  }

  async function handleCoverFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setSuccess(null);
    const invalid = checkFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (mode === "create") {
      const previewUrl = await readAsPreview(file);
      onPendingCoverChange?.({ file, previewUrl });
      return;
    }
    if (!eventId) {
      setError("Enregistrez d'abord l'événement avant d'ajouter une image.");
      return;
    }
    startTransition(async () => {
      const upload = await uploadEventCover(file, eventId);
      if (!upload.ok || !upload.url) {
        setError(upload.error ?? "Envoi de l'image impossible.");
        return;
      }
      const result = await updateEventCoverAction(eventId, upload.url);
      if (!result.ok) {
        setError(result.error ?? "Enregistrement de la couverture impossible.");
        return;
      }
      setCoverUrl(upload.url);
      setSuccess("Image de couverture mise à jour.");
    });
  }

  async function handleGalleryFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setSuccess(null);
    const incoming = [...files];
    for (const file of incoming) {
      const invalid = checkFile(file);
      if (invalid) {
        setError(`« ${file.name} » : ${invalid}`);
        return;
      }
    }
    const existingCount = mode === "create" ? (pendingGallery?.length ?? 0) : gallery.length;
    if (existingCount + incoming.length > MAX_GALLERY_IMAGES) {
      setError(`Galerie limitée à ${MAX_GALLERY_IMAGES} images.`);
      return;
    }
    if (mode === "create") {
      const next = await Promise.all(
        incoming.map(async (file) => ({ file, previewUrl: await readAsPreview(file) })),
      );
      onPendingGalleryChange?.([...(pendingGallery ?? []), ...next]);
      return;
    }
    if (!eventId) {
      setError("Enregistrez d'abord l'événement avant d'ajouter des images.");
      return;
    }
    startTransition(async () => {
      const urls: string[] = [];
      for (const file of incoming) {
        const upload = await uploadEventCover(file, eventId);
        if (upload.ok && upload.url) {
          urls.push(upload.url);
        } else {
          setError(upload.error ?? "Envoi d'une image impossible.");
          return;
        }
      }
      const next = [...gallery, ...urls].slice(0, MAX_GALLERY_IMAGES);
      const result = await updateEventGalleryAction(eventId, next);
      if (!result.ok) {
        setError(result.error ?? "Enregistrement de la galerie impossible.");
        return;
      }
      setGallery(next);
      setSuccess("Galerie mise à jour.");
    });
  }

  function removeCover() {
    if (mode === "create") {
      onPendingCoverChange?.(null);
      return;
    }
    if (!eventId) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateEventCoverAction(eventId, null);
      if (!result.ok) {
        setError(result.error ?? "Suppression impossible.");
        return;
      }
      setCoverUrl(null);
      setSuccess("Image de couverture retirée.");
    });
  }

  function removeGalleryUrl(url: string) {
    if (!eventId) return;
    setError(null);
    setSuccess(null);
    const next = gallery.filter((item) => item !== url);
    startTransition(async () => {
      const result = await updateEventGalleryAction(eventId, next);
      if (!result.ok) {
        setError(result.error ?? "Suppression impossible.");
        return;
      }
      setGallery(next);
    });
  }

  function promoteToCover(url: string) {
    if (!eventId) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateEventCoverAction(eventId, url);
      if (!result.ok) {
        setError(result.error ?? "Mise en couverture impossible.");
        return;
      }
      setCoverUrl(url);
      setSuccess("Image définie comme couverture.");
    });
  }
  const displayedCover = mode === "create" ? (pendingCover?.previewUrl || null) : coverUrl;
  const displayedGallery =
    mode === "create"
      ? (pendingGallery ?? []).map((item) => item.previewUrl).filter(Boolean)
      : gallery;
  const galleryCount = mode === "create" ? (pendingGallery?.length ?? 0) : gallery.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Images de l&apos;événement</CardTitle>
        <CardDescription>
          Une couverture et jusqu&apos;à {MAX_GALLERY_IMAGES} illustrations
          (JPG, PNG, WebP ou AVIF, 5 Mo max).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? <Alert tone="danger" title="Image impossible">{error}</Alert> : null}
        {success ? <Alert tone="success" title="Images à jour">{success}</Alert> : null}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-fg">Image de couverture</p>
          {displayedCover ? (
            <div className="relative aspect-21/9 overflow-hidden rounded-md border border-border bg-bg-muted">
              <Image src={displayedCover} alt="Couverture" fill className="object-cover" />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => coverInputRef.current?.click()} disabled={pending}>
                  Remplacer
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={removeCover} disabled={pending} aria-label="Retirer la couverture">
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={pending}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border-strong bg-bg-subtle px-4 py-8 text-sm text-fg-muted hover:border-fg hover:text-fg",
                pending && "cursor-wait opacity-70",
              )}
            >
              {pending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-5" aria-hidden="true" />}
              Ajouter une image de couverture
              <span className="text-xs text-fg-subtle">JPG, PNG, WebP ou AVIF — 5 Mo max</span>
            </button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            aria-label="Choisir une image de couverture"
            onChange={(e) => {
              handleCoverFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-fg">
              Galerie <span className="font-normal text-fg-subtle">({galleryCount}/{MAX_GALLERY_IMAGES})</span>
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => galleryInputRef.current?.click()}
              disabled={pending || galleryCount >= MAX_GALLERY_IMAGES}
            >
              <ImagePlus className="mr-1.5 size-4" aria-hidden="true" />
              Ajouter
            </Button>
          </div>
          {displayedGallery.length === 0 ? (
            <p className="rounded-md border border-border bg-surface-sunken px-3 py-3 text-xs text-fg-muted">
              Aucune image pour le moment. Les photos du lieu ou de l&apos;ambiance donnent envie.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {displayedGallery.map((url, index) => (
                <li key={`${url}-${index}`} className="group relative aspect-4/3 overflow-hidden rounded-md border border-border bg-bg-muted">
                  <Image src={url} alt={`Illustration ${index + 1}`} fill className="object-cover" />
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/55 px-2 py-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    {mode === "edit" ? (
                      <button
                        type="button"
                        onClick={() => promoteToCover(url)}
                        disabled={pending}
                        title="Définir comme couverture"
                        className="inline-flex size-7 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30"
                      >
                        <Star className="size-3.5" aria-hidden="true" />
                        <span className="sr-only">Définir comme couverture</span>
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (mode === "create") {
                          onPendingGalleryChange?.((pendingGallery ?? []).filter((_, i) => i !== index));
                        } else {
                          removeGalleryUrl(url);
                        }
                      }}
                      disabled={pending}
                      title="Retirer"
                      className="inline-flex size-7 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                      <span className="sr-only">Retirer cette image</span>
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <input
            ref={galleryInputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="sr-only"
            aria-label="Choisir des images de galerie"
            onChange={(e) => {
              handleGalleryFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

