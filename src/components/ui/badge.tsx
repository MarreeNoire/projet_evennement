import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/* =============================================================================
   Badge / pastille
   --------------------------------------------------------------------------
   L'information n'est jamais portée par la couleur seule : le texte est
   toujours présent (WCAG 1.4.1).
   ========================================================================== */

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "border-border bg-bg-muted text-fg-muted",
        primary: "border-transparent bg-primary-subtle text-primary-subtle-fg",
        success: "border-transparent bg-success-subtle text-success",
        warning: "border-transparent bg-warning-subtle text-warning",
        danger: "border-transparent bg-danger-subtle text-danger",
        info: "border-transparent bg-info-subtle text-info",
        // Réservé aux niveaux d'accès VIP / VVIP
        accent: "border-transparent bg-accent-subtle text-accent-subtle-fg",
        outline: "border-border-strong bg-transparent text-fg",
        // Sur photo de couverture
        overlay: "border-white/20 bg-black/60 text-white backdrop-blur-sm",
      },
      size: {
        sm: "px-2 py-0 text-2xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

/* ---------------------------------------------------------------------------
   Badge de niveau d'accès : cohérent partout dans l'application
   (billetterie, billet, check-in, salon VIP).
--------------------------------------------------------------------------- */

const ACCESS_LEVEL_STYLES: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
  standard: "neutral",
  vip: "accent",
  vvip: "accent",
};

const ACCESS_LEVEL_TEXT: Record<string, string> = {
  standard: "Standard",
  vip: "VIP",
  vvip: "VVIP",
};

export function AccessLevelBadge({
  level,
  className,
}: {
  level: string;
  className?: string;
}) {
  // Le niveau VVIP est distingué par un remplissage plein : la différence
  // ne repose donc pas uniquement sur la teinte.
  if (level === "vvip") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-accent-solid px-2.5 py-0.5 text-xs font-bold text-accent-solid-fg",
          className,
        )}
      >
        VVIP
      </span>
    );
  }

  return (
    <Badge variant={ACCESS_LEVEL_STYLES[level] ?? "neutral"} className={className}>
      {ACCESS_LEVEL_TEXT[level] ?? level}
    </Badge>
  );
}