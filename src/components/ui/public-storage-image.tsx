"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";

interface PublicStorageImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  width?: number;
  height?: number;
  fill?: boolean;
  quality?: number;
  preload?: boolean;
  loading?: "eager" | "lazy";
}

function isPublicSupabaseImage(src: string): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;

  try {
    const imageUrl = new URL(src);
    const projectUrl = new URL(supabaseUrl);

    return (
      imageUrl.protocol === "https:" &&
      imageUrl.host === projectUrl.host &&
      imageUrl.pathname.startsWith("/storage/v1/object/public/")
    );
  } catch {
    return false;
  }
}

/**
 * Image publique Supabase, optimisée par Next (`/_next/image`).
 *
 * Si l'optimiseur échoue (quota, upstream indisponible, 5xx), l'image bascule
 * silencieusement sur l'URL Storage brute : une image s'affiche toujours,
 * même dégradée, plutôt qu'un cadre vide.
 */
export function PublicStorageImage({
  src,
  alt,
  className,
  sizes,
  width,
  height,
  fill = false,
  quality = 85,
  preload = false,
  loading = "lazy",
}: PublicStorageImageProps) {
  const fillStyle: CSSProperties | undefined = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
    : undefined;

  /* Repli actif seulement pour les images Supabase optimisables, et une seule
     fois : dès que l'optimiseur a échoué, on reste sur l'URL brute.
     `src` en clé de dérivation : pas d'effet, l'état suit le prop. */
  const [imageKey, setImageKey] = useState(src);
  const [fallback, setFallback] = useState(false);
  const [failed, setFailed] = useState(false);
  const optimizable = isPublicSupabaseImage(src);
  if (imageKey !== src) {
    setImageKey(src);
    setFallback(false);
    setFailed(false);
  }

  if (fallback && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        loading={preload || loading === "eager" ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailed(true)}
        style={fillStyle}
      />
    );
  }

  if (optimizable) {
    return (
      <Image
        src={src}
        alt={alt}
        className={className}
        sizes={sizes}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        quality={quality}
        preload={preload}
        loading={preload ? undefined : loading}
        onError={() => setFallback(true)}
        style={fillStyle}
      />
    );
  }

  return (
    // Les URL externes ne sont pas configurées pour le proxy d’image Next.js.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={preload || loading === "eager" ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={preload || loading === "eager" ? "high" : "auto"}
      style={fillStyle}
    />
  );
}
