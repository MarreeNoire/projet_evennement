import Image from "next/image";

import { cn, getInitials } from "@/lib/utils";

/* =============================================================================
   Avatar
   --------------------------------------------------------------------------
   Repli sur les initiales si aucune image : évite les cadres vides et les
   requêtes réseau inutiles. La teinte du repli est déterministe à partir du
   nom, pour que le même utilisateur garde la même couleur.
   ========================================================================== */

const SIZES = {
  xs: { px: 24, class: "size-6 text-2xs" },
  sm: { px: 32, class: "size-8 text-xs" },
  md: { px: 40, class: "size-10 text-sm" },
  lg: { px: 56, class: "size-14 text-base" },
  xl: { px: 96, class: "size-24 text-2xl" },
} as const;

export type AvatarSize = keyof typeof SIZES;

const FALLBACK_TONES = [
  "bg-brand-100 text-brand-800",
  "bg-gold-100 text-gold-700",
  "bg-info-subtle text-info",
  "bg-success-subtle text-success",
  "bg-bg-muted text-fg-muted",
] as const;

function toneFor(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 997;
  }
  // `as const` garantit un index 0 toujours défini.
  return FALLBACK_TONES[hash % FALLBACK_TONES.length] ?? FALLBACK_TONES[0];
}

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
  /** Anneau de mise en avant (organisateur vérifié, membre en ligne…). */
  ring?: boolean;
}

export function Avatar({ src, name, size = "md", className, ring = false }: AvatarProps) {
  const dimensions = SIZES[size];

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        dimensions.class,
        ring && "ring-2 ring-accent-solid ring-offset-2 ring-offset-bg",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          width={dimensions.px * 2}
          height={dimensions.px * 2}
          className="size-full object-cover"
          sizes={`${dimensions.px}px`}
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "flex size-full items-center justify-center font-semibold select-none",
            toneFor(name),
          )}
        >
          {getInitials(name)}
        </span>
      )}
      {/* Le nom reste accessible : l'image est décorative (alt="") */}
      <span className="sr-only">{name}</span>
    </span>
  );
}

/* ---------------------------------------------------------------------------
   Groupe d'avatars superposés (« 12 participants »)
--------------------------------------------------------------------------- */

export function AvatarGroup({
  people,
  max = 4,
  size = "sm",
  className,
}: {
  people: { id: string; name: string; avatarUrl?: string | null }[];
  max?: number;
  size?: AvatarSize;
  className?: string;
}) {
  const visible = people.slice(0, max);
  const hiddenCount = Math.max(people.length - visible.length, 0);

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex -space-x-2">
        {visible.map((person) => (
          <Avatar
            key={person.id}
            src={person.avatarUrl}
            name={person.name}
            size={size}
            className="ring-2 ring-surface"
          />
        ))}
      </div>
      {hiddenCount > 0 ? (
        <span className="ml-2 text-xs font-medium text-fg-muted">+{hiddenCount}</span>
      ) : null}
    </div>
  );
}