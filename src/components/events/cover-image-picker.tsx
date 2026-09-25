"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";

/* =============================================================================
   Sélecteur d'image de couverture d'événement
   --------------------------------------------------------------------------
   Composant contrôlé et volontairement simple :

   * `value`        — URL affichée (URL publique existante OU URL d'objet
                      locale créée pour l'aperçu avant envoi) ;
   * `onSelect`     — nouveau fichier choisi : le parent garde le `File` et
                      décide quand l'envoyer (l'événement doit exister en base
                      avant l'upload, cf. lib/events/upload-cover.ts) ;
   * `onClear`      — retrait de l'image.

   L'aperçu utilise un <img> natif : il doit accepter les URL d'objet
   (`blob:`) locales, ce que next/image ne permet pas.
   ========================================================================== */

const ACCEPT_ATTR = "image/jpeg,image/png,image/webp,image/avif";

export function CoverImagePicker({
  value,
  onSelect,
  onClear,
  disabled = false,
  uploading = false,
}: {
  /** URL affichée dans l'aperçu (publique ou `blob:` locale). `null` = vide. */
  value: string | null;
  onSelect: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
  /** Affiche un voile de progression pendant l'envoi vers Storage. */
  uploading?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Permet de re-sélectionner le même fichier après un retrait.
    e.target.value = "";
    if (!file) return;

    if (!ACCEPT_ATTR.split(",").includes(file.type)) {
      setError("Format non pris en charge : JPG, PNG, WebP ou AVIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image trop lourde : 5 Mo maximum.");
      return;
    }

    setError(null);
    onSelect(file);
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="sr-only"
        onChange={handleChange}
        disabled={disabled || uploading}
        aria-label="Choisir une image de couverture"
      />

      {value ? (
        <div className="relative aspect-21/9 overflow-hidden rounded-xl border border-border bg-bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local blob: possible */}
          <img
            src={value}
            alt="Aperçu de l'image de couverture"
            className="size-full object-cover"
          />
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 text-sm font-semibold text-white">
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              Envoi de l'image…
            </div>
          ) : null}
          {!disabled && !uploading ? (
            <div className="absolute right-3 bottom-3 flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-black/55 px-3.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Remplacer
              </button>
              <button
                type="button"
                onClick={onClear}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-black/55 px-3.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-danger-solid"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Retirer
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex aspect-21/9 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-strong bg-bg-subtle text-fg-muted transition-colors hover:border-primary hover:bg-primary-subtle hover:text-primary disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="size-7 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="size-7" aria-hidden="true" />
          )}
          <span className="text-sm font-semibold">
            {uploading ? "Envoi de l'image…" : "Ajouter une image de couverture"}
          </span>
          <span className="text-xs">JPG, PNG, WebP ou AVIF — 5 Mo max — format paysage conseillé</span>
        </button>
      )}

      {error ? (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
