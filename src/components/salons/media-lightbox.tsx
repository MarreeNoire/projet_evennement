"use client";

import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { haptic } from "@/lib/ui/haptics";
import { cn } from "@/lib/utils";

/* =============================================================================
   Lightbox plein écran des médias d'une publication
   --------------------------------------------------------------------------
   Ouverture au tap sur une image, navigation ← →, fermeture avec Échap, clic
   sur le fond ou X. Focus posé sur le bouton de fermeture, rendu au lazy
   avec dimensions de précaution (aucun décalage).
   ========================================================================== */

export interface LightboxMedia {
  url: string;
  kind: "image" | "video";
}

export function MediaLightbox({
  open,
  index,
  media,
  alt,
  onClose,
  onIndexChange,
}: {
  open: boolean;
  index: number | null;
  media: LightboxMedia[];
  /** Description de la publication, au cas où la légende manque. */
  alt: string;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const mediaItem = index !== null ? (media[index] ?? null) : null;

  const go = useCallback(
    (delta: number) => {
      if (index === null || media.length === 0) return;
      const next = (index + delta + media.length) % media.length;
      onIndexChange(next);
      haptic("light");
    },
    [index, media.length, onIndexChange],
  );

  useEffect(() => {
    if (!open || index === null) return;

    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, index, onClose, go]);

  if (!open || !mediaItem) return null;
  const many = media.length > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Aperçu plein écran"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/92 p-4"
      onKeyDown={(event) => {
        /* Échap / flèches affinées quand le focus est sur un bouton */
        if (event.key === "ArrowRight") go(1);
        if (event.key === "ArrowLeft") go(-1);
      }}
    >
      {/* Fond cliquable : sous l'image, au-dessus du fond noir */}
      <button
        type="button"
        aria-label="Fermer l’aperçu"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        tabIndex={-1}
      />

      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 z-10 inline-flex size-11 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/22"
        aria-label="Fermer"
      >
        <X className="size-5" aria-hidden="true" />
      </button>

      {many ? (
        <button
          type="button"
          onClick={() => go(-1)}
          className="absolute top-1/2 left-2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/22"
          aria-label="Média précédent"
        >
          <ChevronLeft className="size-6" aria-hidden="true" />
        </button>
      ) : null}

      {many ? (
        <button
          type="button"
          onClick={() => go(1)}
          className="absolute top-1/2 right-2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/22"
          aria-label="Média suivant"
        >
          <ChevronRight className="size-6" aria-hidden="true" />
        </button>
      ) : null}

      <figure className="relative z-[1] flex max-h-full w-full max-w-[min(96rem,96vw)] flex-col items-center gap-3">
        {mediaItem.kind === "video" ? (
          /* Pas d’uploader de vidéo via le salon pour l’instant : dégrade propre. */
          <video
            src={mediaItem.url}
            controls
            playsInline
            preload="metadata"
            className="max-h-[78vh] w-auto max-w-full rounded-xl"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaItem.url}
            alt={alt}
            loading="eager"
            decoding="async"
            className={cn("max-h-[78vh] w-auto max-w-full rounded-xl object-contain")}
          />
        )}
        {many ? (
          <figcaption className="bg-white/12 text-xs font-semibold text-white rounded-full px-3 py-1">
            {(index ?? 0) + 1} / {media.length}
          </figcaption>
        ) : null}
      </figure>
    </div>
  );
}
