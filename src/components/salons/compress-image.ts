"use client";

/* =============================================================================
   Compression d'image côté client
   --------------------------------------------------------------------------
   Avant l'envoi vers le bucket `salon-photos`, chaque photo est redimensionnée
   (max ~1600 px de côté) puis ré-encodée en JPEG (~0.82). Réduit fortement le
   poids sans dépendance : canvas natif.
   ========================================================================== */

const MAX_SIDE = 1600;
const QUALITY = 0.82;
const MAX_BYTES_SOFT = 4 * 1024 * 1024; /* au-delà, on re-comprime plus dur */

export interface CompressedImage {
  file: File;
  width: number;
  height: number;
}

function loadBitmap(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible"));
    };
    image.src = url;
  });
}

function drawScaled(image: HTMLImageElement, maxSide: number, quality: number): Promise<Blob> {
  const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * ratio));
  const height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");
  ctx.drawImage(image, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Compression impossible"));
      },
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Compresse une image choisie par l'utilisateur. En cas d'échec (format
 * exotique, mémoire), renvoie le fichier original pour tenter l'envoi tel quel.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  const fallback: CompressedImage = { file, width: 0, height: 0 };
  if (!file.type.startsWith("image/") || file.type === "image/gif") return fallback;

  try {
    const image = await loadBitmap(file);
    let blob = await drawScaled(image, MAX_SIDE, QUALITY);
    /* Encore trop lourd (photo RAW) : seconde passe plus agressive. */
    if (blob.size > MAX_BYTES_SOFT) {
      blob = await drawScaled(image, 1280, 0.72);
    }
    const name = file.name.replace(/\.[^.]+$/, "") || "photo";
    const compressed = new File([blob], `${name}.jpg`, { type: "image/jpeg" });
    return {
      file: compressed.size < file.size ? compressed : file,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  } catch {
    return fallback;
  }
}
