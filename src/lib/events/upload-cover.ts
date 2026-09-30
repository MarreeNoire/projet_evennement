/* =============================================================================
   Envoi d'une image de couverture d'événement vers Supabase Storage
   --------------------------------------------------------------------------
   Module utilisé côté navigateur (composants client) : il passe par le client
   Supabase du navigateur, donc par la session de l'utilisateur connecté.

   Rappels posés par la migration 0032 (`storage.sql`) :
   * bucket `event-covers`, public en lecture, 5 Mo maximum,
     MIME : jpeg / png / webp / avif ;
   * convention de chemin `event-covers/{event_id}/{fichier}` ;
   * l'INSERT n'est autorisé que si l'utilisateur peut gérer l'événement
     (`can_manage_event`). L'événement doit donc EXISTER en base avant
     l'envoi : à la création, on enregistre d'abord l'événement, puis on
     envoie l'image, puis on associe l'URL (cf. updateEventCoverAction).
   ========================================================================== */

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { STORAGE_BUCKETS } from "@/lib/constants";

/** Limite alignée sur `file_size_limit` du bucket (5 Mo). */
const MAX_COVER_SIZE = 5 * 1024 * 1024;
const MAX_SOURCE_SIZE = 20 * 1024 * 1024;

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function getSupportedImageType(file: File): string | null {
  if (ACCEPTED_MIME_TYPES.includes(file.type)) return file.type;
  if (file.type) return null;
  const extension = file.name.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
  };
  return types[extension ?? ""] ?? null;
}

export interface UploadCoverResult {
  ok: boolean;
  /** URL publique de l'image, prête pour `events.cover_url`. */
  url?: string;
  /** Chemin Storage utilisé pour supprimer l'image si la publication échoue. */
  path?: string;
  error?: string;
}

/** Nombre maximum d'images dans la galerie d'un événement. */
export const MAX_GALLERY_IMAGES = 6;

/**
 * Envoie `file` dans `event-covers/{eventId}/…` et retourne son URL publique.
 * L'événement doit déjà exister en base (exigence de la policy RLS).
 */
export async function uploadEventCover(file: File, eventId: string): Promise<UploadCoverResult> {
  if (!file) {
    return { ok: false, error: "Aucun fichier sélectionné." };
  }

  const contentType = getSupportedImageType(file);
  if (!contentType) {
    return {
      ok: false,
      error: "Format non pris en charge : utilisez une image JPG, PNG, WebP ou AVIF.",
    };
  }

  if (file.size > MAX_SOURCE_SIZE) {
    return { ok: false, error: "Image trop lourde : 20 Mo maximum avant optimisation." };
  }

  try {
    let uploadFile = file;
    if (uploadFile.size > MAX_COVER_SIZE) {
      try {
        const bitmap = await createImageBitmap(uploadFile);
        const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Le navigateur ne peut pas optimiser cette image.");
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
        if (!blob || blob.size > MAX_COVER_SIZE) {
          return { ok: false, error: "Image encore trop lourde après optimisation (5 Mo maximum)." };
        }
        uploadFile = new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
          type: "image/webp",
          lastModified: file.lastModified,
        });
      } catch {
        return { ok: false, error: "Cette image ne peut pas être optimisée. Essaie un JPG, PNG, WebP ou AVIF de moins de 5 Mo." };
      }
    }
    const uploadContentType = uploadFile.type || contentType;
    const supabase = createSupabaseBrowserClient();
    const ext =
      uploadFile.name
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${eventId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.EVENT_COVERS)
      .upload(path, uploadFile, {
        cacheControl: "3600",
        contentType: uploadContentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("[uploadEventCover]", uploadError.message);
      return {
        ok: false,
        error: `Envoi impossible : ${uploadError.message}`,
      };
    }

    const { data } = supabase.storage.from(STORAGE_BUCKETS.EVENT_COVERS).getPublicUrl(path);

    if (!data?.publicUrl) {
      return { ok: false, error: "L'image a été envoyée mais son URL est introuvable." };
    }

    return { ok: true, url: data.publicUrl, path };
  } catch (err: any) {
    console.error("[uploadEventCover] Unexpected error:", err);
    return { ok: false, error: err?.message || "Une erreur inattendue est survenue." };
  }
}

/**
 * Envoie plusieurs images de galerie (`event-covers/{eventId}/gallery-…`)
 * et retourne la liste de leurs URL publiques. Les échecs individuels sont
 * ignorés : seules les images envoyées avec succès sont renvoyées, avec le
 * premier message d'erreur rencontré le cas échéant.
 */
export async function uploadEventGalleryImages(
  files: File[],
  eventId: string,
): Promise<{ urls: string[]; error?: string }> {
  const remaining = MAX_GALLERY_IMAGES;

  const selected = files.filter((file) => ACCEPTED_MIME_TYPES.includes(file.type)).slice(0, remaining);

  if (selected.length === 0) {
    return { urls: [], error: "Aucune image valide à envoyer (JPG, PNG, WebP ou AVIF)." };
  }

  const urls: string[] = [];
  let firstError: string | undefined;

  for (const file of selected) {
    if (file.size > MAX_SOURCE_SIZE) {
      firstError ??= `« ${file.name} » dépasse 20 Mo et a été ignorée.`;
      continue;
    }

    const result = await uploadEventCover(file, eventId);
    if (result.ok && result.url) {
      urls.push(result.url);
    } else if (!firstError) {
      firstError = result.error;
    }
  }

  return { urls, error: urls.length > 0 ? undefined : firstError };
}
