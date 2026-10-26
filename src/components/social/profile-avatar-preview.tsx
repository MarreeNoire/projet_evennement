"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";

export function ProfileAvatarPreview({ src, name }: { src: string | null; name: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Agrandir la photo de ${name}`}
        className="group focus-visible:ring-primary rounded-full focus-visible:ring-2 focus-visible:ring-offset-4"
      >
        <Avatar
          src={src}
          name={name}
          size="xl"
          className="transition-transform duration-200 group-hover:scale-105"
        />
      </button>

      {open ? (
        <div
          className="bg-overlay/70 fixed inset-0 z-[100] flex items-center justify-center p-5"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo de profil de ${name}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-surface border-border relative flex max-h-[90dvh] w-full max-w-md flex-col items-center gap-4 rounded-2xl border p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer l’aperçu de la photo"
              className="border-border-strong bg-surface hover:bg-bg-muted absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-full border transition-colors"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <p className="text-fg-muted max-w-[calc(100%-3rem)] truncate text-sm font-semibold">
              {name}
            </p>
            <div className="bg-bg-muted relative size-[min(72vw,20rem)] overflow-hidden rounded-full">
              {src ? (
                <Image
                  src={src}
                  alt={`Photo de ${name}`}
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              ) : (
                <div className="text-primary flex size-full items-center justify-center text-7xl font-semibold">
                  {name.trim().charAt(0).toLocaleUpperCase() || "?"}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
