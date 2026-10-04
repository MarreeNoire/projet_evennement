"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function CommunityCoverPicker({
  onChange,
  disabled = false,
}: {
  onChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  function chooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Choisis une image JPG, PNG, WebP ou AVIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("L’image doit faire 5 Mo maximum.");
      return;
    }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const nextPreview = URL.createObjectURL(file);
    previewRef.current = nextPreview;
    setPreview(nextPreview);
    setFileName(file.name);
    setError("");
    onChange(file);
  }

  function clearFile() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPreview(null);
    setFileName("");
    setError("");
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">
        Image de couverture <span className="text-fg-subtle font-normal">(facultative)</span>
      </span>
      {preview ? (
        <div className="border-border overflow-hidden rounded-xl border">
          {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local blob: */}
          <img
            src={preview}
            alt={`Aperçu de ${fileName}`}
            className="aspect-[16/7] w-full object-cover"
          />
          <div className="flex items-center justify-between gap-3 p-3">
            <span className="text-fg-muted min-w-0 truncate text-xs">{fileName}</span>
            <button
              type="button"
              onClick={clearFile}
              disabled={disabled}
              className="text-fg-muted hover:text-danger inline-flex shrink-0 items-center gap-1.5 text-sm disabled:opacity-50"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Retirer
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="border-border bg-bg-muted/40 text-fg-muted hover:border-primary/50 hover:bg-bg-muted flex aspect-[16/7] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm transition-colors disabled:opacity-50"
        >
          <ImagePlus className="text-primary size-6" aria-hidden="true" />
          <span>Ajouter une image (5 Mo max.)</span>
          <span className="text-fg-subtle text-xs">JPG, PNG, WebP ou AVIF</span>
        </button>
      )}
      {preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="text-primary text-xs font-medium hover:underline disabled:opacity-50"
        >
          Remplacer l’image
        </button>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        aria-label="Choisir une image de couverture"
        onChange={chooseFile}
        disabled={disabled}
      />
      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
