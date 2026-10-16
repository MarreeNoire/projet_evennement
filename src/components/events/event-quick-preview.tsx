"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, CalendarDays, MapPin, X } from "lucide-react";

import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { getCategoryLabel } from "@/lib/constants";
import { formatDateRange } from "@/lib/utils";
import type { PublishedEventView } from "@/types/database";

export function EventQuickPreview({
  event,
  formattedPrice,
}: {
  event: PublishedEventView;
  formattedPrice: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const previewId = `event-preview-${useId()}`;
  const imageUrl = event.cover_url ?? event.gallery[0] ?? null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-controls={previewId}
        onClick={() => setOpen(true)}
        className="border-border text-fg hover:border-primary hover:bg-bg-muted focus-visible:ring-border-focus inline-flex min-h-10 items-center gap-2 border px-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        Aperçu rapide
        <ArrowUpRight className="size-4" aria-hidden="true" />
      </button>

      <dialog
        id={previewId}
        ref={dialogRef}
        aria-labelledby={`${previewId}-title`}
        aria-describedby={event.summary ? `${previewId}-summary` : undefined}
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
        className="border-border bg-surface text-fg m-auto max-h-[calc(100dvh-2rem)] w-[min(64rem,calc(100vw-2rem))] max-w-none overflow-y-auto border p-0 backdrop:bg-black/60"
      >
        <div className="grid md:grid-cols-[1.1fr_1fr]">
          <div className="bg-bg-muted border-border relative aspect-[16/9] overflow-hidden border-b md:aspect-auto md:min-h-96 md:border-r md:border-b-0">
            {imageUrl ? (
              <PublicStorageImage
                src={imageUrl}
                alt={`Couverture de ${event.title}`}
                fill
                sizes="(min-width: 768px) 55vw, 100vw"
                quality={72}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full min-h-56 items-center justify-center p-8 text-center">
                <p className="font-display text-fg-muted max-w-xs text-2xl font-semibold">
                  {getCategoryLabel(event.category)}
                </p>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col p-5 sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <p className="eyebrow">{getCategoryLabel(event.category)}</p>
              <button
                type="button"
                aria-label="Fermer l’aperçu"
                onClick={() => setOpen(false)}
                className="text-fg-muted hover:bg-bg-muted hover:text-fg focus-visible:ring-border-focus -mt-2 -mr-2 inline-flex size-11 shrink-0 items-center justify-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <h2
              id={`${previewId}-title`}
              className="font-display text-2xl leading-tight font-bold sm:text-3xl"
            >
              {event.title}
            </h2>
            {event.summary ? (
              <p id={`${previewId}-summary`} className="text-fg-muted mt-3 text-sm leading-relaxed">
                {event.summary}
              </p>
            ) : null}

            <dl className="border-border mt-6 grid gap-4 border-y py-5 text-sm">
              <div className="flex items-start gap-3">
                <CalendarDays className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div>
                  <dt className="text-fg-subtle text-xs font-semibold">Date</dt>
                  <dd className="mt-1 font-medium">
                    {formatDateRange(event.start_at, event.end_at)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div>
                  <dt className="text-fg-subtle text-xs font-semibold">Lieu</dt>
                  <dd className="mt-1 font-medium">
                    {event.venue_name ? `${event.venue_name}, ` : ""}
                    {event.city}, {event.country}
                  </dd>
                </div>
              </div>
            </dl>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-5">
              <div>
                <p className="text-fg-subtle text-xs">Organisé par {event.organizer_name}</p>
                <p className="mt-1 text-lg font-bold tabular-nums">{formattedPrice}</p>
              </div>
              <Link
                href={`/evenements/${event.slug}`}
                onClick={() => setOpen(false)}
                className="bg-primary-solid text-primary-solid-fg hover:bg-primary-solid-hover focus-visible:ring-border-focus inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Voir l’événement
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
