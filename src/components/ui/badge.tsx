import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/* =============================================================================
   Badge / pastille
   --------------------------------------------------------------------------
   L'information n'est jamais portée par la couleur seule : le texte est
   toujours présent (WCAG 1.4.1).
   ========================================================================== */

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border font-semibold tracking-[0.08em] uppercase whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "border-border bg-bg-muted text-fg-muted",
        primary: "border-primary/35 bg-primary-subtle text-primary-subtle-fg",
        success: "border-success/30 bg-success-subtle text-success",
        warning: "border-warning/35 bg-warning-subtle text-warning",
        danger: "border-danger/30 bg-danger-subtle text-danger",
        info: "border-info/35 bg-info-subtle text-info",
        // Réservé aux niveaux d'accès VIP / VVIP
        accent: "border-accent/40 bg-accent-subtle text-accent-subtle-fg",
        outline: "border-border-strong bg-transparent text-fg",
        // Sur photo de couverture
        overlay: "border-white/20 bg-black/75 text-white",
      },
      size: {
        sm: "px-1.5 py-0 text-2xs",
        md: "px-2 py-0.5 text-2xs",
        lg: "px-2.5 py-1 text-xs",
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

export function AccessLevelBadge({ level, className }: { level: string; className?: string }) {
  // Le niveau VVIP est distingué par un remplissage plein : la différence
  // ne repose donc pas uniquement sur la teinte.
  if (level === "vvip") {
    return (
      <span
        className={cn(
          "bg-[linear-gradient(135deg,#d89a3f,#e6ab55)] text-2xs inline-flex items-center rounded-full px-2 py-0.5 font-bold tracking-[0.08em] text-[#1b1310] uppercase shadow-[0_0_18px_-4px_rgba(255,106,0,0.8)]",
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
