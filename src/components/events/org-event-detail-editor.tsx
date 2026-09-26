"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Save,
  CheckCircle2,
  Eye,
  Globe,
  Lock,
  ImagePlus,
  Trash2,
  X,
  Loader2,
  Star,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import { EVENT_STATUS_LABELS, type EventStatus } from "@/lib/constants";
import {
  deleteEventAction,
  setEventStatusAction,
  updateEventDetailsAction,
  updateEventCoverAction,
  updateEventGalleryAction,
} from "@/lib/events/actions";
import { uploadEventCover } from "@/lib/events/upload-cover";
import { LIMITS } from "@/lib/constants";

export interface OrgEventDetailProps {
  id: string;
  initialTitle?: string;
  initialVenue?: string;
  initialCity?: string;
  initialStatus?: string;
  initialSlug?: string;
  /** Valeur prête pour un `<input type="datetime-local">` (ex : 2026-11-15T19:00). */
  initialStartAt?: string;
  /** Valeur prête pour un `<input type="datetime-local">`. */
  initialEndAt?: string;
  /** URL actuelle de l'image de couverture */
  initialCoverUrl?: string | null;
  /** URLs actuelles de la galerie */
  initialGalleryUrls?: string[];
}

export interface PendingImage {
  file: File;
  previewUrl: string;
}

export function OrgEventDetailEditor({
  id,
  initialTitle = "",
  initialVenue = "",
  initialCity = "Abidjan",
  initialStatus = "draft",
  initialSlug = "",
  initialStartAt = "",
  initialEndAt = "",
  initialCoverUrl = null,
  initialGalleryUrls = [],
}: OrgEventDetailProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [venue, setVenue] = useState(initialVenue);
  const [city, setCity] = useState(initialCity);
  const [status, setStatus] = useState(initialStatus);
  const [startAt, setStartAt] = useState(initialStartAt);
  const [endAt, setEndAt] = useState(initialEndAt);
  const [isFinished, setIsFinished] = useState(false);

  // Image management state
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl);
  const [gallery, setGallery] = useState<string[]>(initialGalleryUrls);
  const [pendingCover, setPendingCover] = useState<PendingImage | null>(null);
  const [pendingGallery, setPendingGallery] = useState<PendingImage[]>([]);
  const [uploadState, setUploadState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [statusPending, startStatusTransition] = useTransition();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Constants
  const ACCEPT = LIMITS.ACCEPTED_IMAGE_TYPES.join(",");
  const MAX_GALLERY_IMAGES = 6; // From sanitizeGalleryUrls in actions.ts

  // Calculé après le montage : évite tout écart d'hydratation, puis se met à
  // jour dès que l'organisateur corrige la date de fin.
  useEffect(() => {
    const endsAt = endAt ? new Date(endAt).getTime() : Number.NaN;
    setIsFinished(!Number.isNaN(endsAt) && endsAt <= Date.now());
  }, [endAt]);

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
    if (!id) {
      setError("Enregistrez d'abord l'événement avant d'ajouter une image.");
      return;
    }
    startTransition(async () => {
      const upload = await uploadEventCover(file, id);
      if (!upload.ok || !upload.url) {
        setError(upload.error ?? "Envoi de l'image impossible.");
        return;
      }
      const result = await updateEventCoverAction(id, upload.url);
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
    const existingCount = gallery.length;
    if (existingCount + incoming.length > MAX_GALLERY_IMAGES) {
      setError(`Galerie limitée à ${MAX_GALLERY_IMAGES} images.`);
      return;
    }
    if (!id) {
      setError("Enregistrez d'abord l'événement avant d'ajouter des images.");
      return;
    }
    startTransition(async () => {
      const urls: string[] = [];
      for (const file of incoming) {
        const upload = await uploadEventCover(file, id);
        if (upload.ok && upload.url) {
          urls.push(upload.url);
        } else {
          setError(upload.error ?? "Envoi d'une image impossible.");
          return;
        }
      }
      const next = [...gallery, ...urls].slice(0, MAX_GALLERY_IMAGES);
      const result = await updateEventGalleryAction(id, next);
      if (!result.ok) {
        setError(result.error ?? "Enregistrement de la galerie impossible.");
        return;
      }
      setGallery(next);
      setSuccess("Galerie mise à jour.");
    });
  }

  function removeCover() {
    if (!id) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateEventCoverAction(id, null);
      if (!result.ok) {
        setError(result.error ?? "Suppression impossible.");
        return;
      }
      setCoverUrl(null);
      setSuccess("Image de couverture retirée.");
    });
  }

  function removeGalleryUrl(url: string) {
    if (!id) return;
    setError(null);
    setSuccess(null);
    const next = gallery.filter((item) => item !== url);
    startTransition(async () => {
      const result = await updateEventGalleryAction(id, next);
      if (!result.ok) {
        setError(result.error ?? "Suppression impossible.");
        return;
      }
      setGallery(next);
    });
  }

  function promoteToCover(url: string) {
    if (!id) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateEventCoverAction(id, url);
      if (!result.ok) {
        setError(result.error ?? "Mise en couverture impossible.");
        return;
      }
      setCoverUrl(url);
      setSuccess("Image définie comme couverture.");
    });
  }

  function handleToggleStatus() {
    startStatusTransition(async () => {
      const result = await setEventStatusAction(id, status === "published" ? "draft" : "published");
      if (!result.ok) {
        setError(result.error ?? "Échec du changement de statut.");
        return;
      }

      setStatus(status === "published" ? "draft" : "published");
      setSuccess("Statut mis à jour.");
    });
  }

  function handleDelete() {
    if (
      !window.confirm("Supprimer définitivement cet événement ? Cette action est irréversible.")
    ) {
      return;
    }

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await deleteEventAction(id);
      if (!result.ok) {
        setError(result.error ?? "Suppression impossible.");
        return;
      }
      router.push("/org/evenements");
      router.refresh();
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateEventDetailsAction({
        eventId: id,
        title,
        city,
        venueName: venue,
        startAt,
        endAt,
      });
      if (!result.ok) {
        setError(result.error ?? "Échec de la mise à jour.");
        return;
      }
      setSuccess("Événement mis à jour.");
    });
  }

  const displayedCover = coverUrl;
  const displayedGallery = gallery;
  const galleryCount = gallery.length;

  return (
    <div className="space-y-6">
      {error ? (
        <Alert tone="danger" title="Erreur">
          {error}
        </Alert>
      ) : null}

      {success ? (
        <Alert tone="success" title="Mise à jour réussie">
          {success}
        </Alert>
      ) : null}

      {warning ? (
        <Alert tone="warning" title="À vérifier">
          {warning}
        </Alert>
      ) : null}

      {isFinished ? (
        <Alert tone="danger" title="Événement terminé, il n’apparaît plus dans Explorer">
          La date de fin est dépassée. Explorer, l&apos;accueil et l&apos;annuaire des organisateurs
          n&apos;affichent que les événements à venir : corrigez la date de fin ci-dessous puis
          enregistrez pour que l&apos;événement redevienne visible.
        </Alert>
      ) : null}

      <div className="border-border flex items-center justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
            <Badge
              variant={
                status === "published" ? "success" : status === "draft" ? "warning" : "neutral"
              }
            >
              {EVENT_STATUS_LABELS[status as EventStatus] ?? status}
            </Badge>
          </div>
          <p className="text-fg-muted text-xs">
            ID : {id} · {venue}
          </p>
          <p className="text-fg-muted mt-1 text-xs">
            {status === "published"
              ? "Visible dans Explorer tant que la date de fin n'est pas dépassée."
              : "Un brouillon n'apparaît jamais dans Explorer : publiez-le pour le rendre visible."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleToggleStatus}
            loading={statusPending}
            loadingLabel={status === "published" ? "Dépublication…" : "Publication…"}
            title={status === "published" ? "Passer en brouillon" : "Publier l'événement"}
          >
            {status === "published" ? (
              <>
                <Lock className="mr-1.5 size-3.5" /> Dépublier
              </>
            ) : (
              <>
                <Globe className="mr-1.5 size-3.5" /> Publier
              </>
            )}
          </Button>
          {initialSlug ? (
            <ButtonLink
              href={`/evenements/${initialSlug}`}
              variant="secondary"
              size="sm"
              target="_blank"
            >
              <Eye className="mr-1.5 size-3.5" /> Voir la fiche publique
            </ButtonLink>
          ) : null}
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            loading={pending}
            loadingLabel="Suppression…"
            title="Supprimer définitivement l'événement"
          >
            <Trash2 className="mr-1.5 size-3.5" /> Supprimer
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dates de l&apos;événement</CardTitle>
            <CardDescription>
              L&apos;événement n&apos;apparaît dans Explorer que si sa date de fin est à venir.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="eventStartAt" className="text-fg text-xs font-semibold">
                Date &amp; heure de début *
              </label>
              <input
                id="eventStartAt"
                type="datetime-local"
                required
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="border-border focus:border-border-focus w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="eventEndAt" className="text-fg text-xs font-semibold">
                Date &amp; heure de fin *
              </label>
              <input
                id="eventEndAt"
                type="datetime-local"
                required
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                aria-describedby="eventEndAtHint"
                className="border-border focus:border-border-focus w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none"
              />
              <p id="eventEndAtHint" className="text-fg-subtle text-xs">
                Choisissez une date future : une date passée retire l&apos;événement de la recherche
                publique.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modification des détails de l&apos;événement</CardTitle>
            <CardDescription>
              Mettez à jour le nom, la ville et l&apos;adresse de votre événement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="eventTitle" className="text-fg text-xs font-semibold">
                Nom de l&apos;événement *
              </label>
              <input
                id="eventTitle"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-border focus:border-border-focus w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="eventCity" className="text-fg text-xs font-semibold">
                  Ville *
                </label>
                <input
                  id="eventCity"
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="border-border focus:border-border-focus w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="eventVenue" className="text-fg text-xs font-semibold">
                  Lieu / Adresse précise
                </label>
                <input
                  id="eventVenue"
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="border-border focus:border-border-focus w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" loading={pending} loadingLabel="Enregistrement...">
                <Save className="mr-2 size-4" /> Mettre à jour
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Image Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Images de l&apos;événement</CardTitle>
          <CardDescription>
            Une couverture et jusqu&apos;à {MAX_GALLERY_IMAGES} illustrations (JPG, PNG, WebP ou
            AVIF, 5 Mo max).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <Alert tone="danger" title="Image impossible">
              {error}
            </Alert>
          ) : null}
          {success ? (
            <Alert tone="success" title="Images à jour">
              {success}
            </Alert>
          ) : null}
          <div className="space-y-2">
            <p className="text-fg text-xs font-semibold">Image de couverture</p>
            {displayedCover ? (
              <div className="border-border bg-bg-muted relative aspect-21/9 overflow-hidden rounded-md border">
                <Image src={displayedCover} alt="Couverture" fill className="object-cover" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={pending}
                  >
                    Remplacer
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={removeCover}
                    disabled={pending}
                    aria-label="Retirer la couverture"
                  >
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
                  "border-border-strong bg-bg-subtle text-fg-muted hover:border-fg hover:text-fg flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-8 text-sm",
                  pending && "cursor-wait opacity-70",
                )}
              >
                {pending ? (
                  <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                ) : (
                  <ImagePlus className="size-5" aria-hidden="true" />
                )}
                Ajouter une image de couverture
                <span className="text-fg-subtle text-xs">JPG, PNG, WebP ou AVIF, 5 Mo maximum</span>
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
              <p className="text-fg text-xs font-semibold">
                Galerie{" "}
                <span className="text-fg-subtle font-normal">
                  ({galleryCount}/{MAX_GALLERY_IMAGES})
                </span>
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
              <p className="border-border bg-surface-sunken text-fg-muted rounded-md border px-3 py-3 text-xs">
                Aucune image pour le moment. Les photos du lieu ou de l&apos;ambiance donnent envie.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {displayedGallery.map((url, index) => (
                  <li
                    key={`${url}-${index}`}
                    className="group border-border bg-bg-muted relative aspect-4/3 overflow-hidden rounded-md border"
                  >
                    <Image
                      src={url}
                      alt={`Illustration ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/55 px-2 py-1.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => promoteToCover(url)}
                        disabled={pending}
                        title="Définir comme couverture"
                        className="inline-flex size-7 items-center justify-center rounded-sm bg-white/15 text-white hover:bg-white/30"
                      >
                        <Star className="size-3.5" aria-hidden="true" />
                        <span className="sr-only">Définir comme couverture</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          removeGalleryUrl(url);
                        }}
                        disabled={pending}
                        title="Retirer"
                        className="inline-flex size-7 items-center justify-center rounded-sm bg-white/15 text-white hover:bg-white/30"
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
    </div>
  );
}
