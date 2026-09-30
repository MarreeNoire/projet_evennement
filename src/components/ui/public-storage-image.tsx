import Image from "next/image";

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

/** Optimise les images publiques Supabase et conserve les autres URL externes. */
export function PublicStorageImage({
  src,
  alt,
  className,
  sizes,
  width,
  height,
  fill = false,
  preload = false,
}: PublicStorageImageProps) {
  if (isPublicSupabaseImage(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        className={className}
        sizes={sizes}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        preload={preload}
        unoptimized
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
      loading={preload ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={preload ? "high" : "auto"}
      style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%" } : undefined}
    />
  );
}
