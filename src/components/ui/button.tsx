import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

/* =============================================================================
   Bouton
   --------------------------------------------------------------------------
   États couverts : hover, focus-visible (anneau global), active, disabled,
   chargement. Zone tactile minimale de 44 px sur mobile via `size`.
   ========================================================================== */

export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-semibold",
    "rounded-full border border-transparent",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-150",
    "ease-[var(--ease-out-soft)]",
    "select-none",
    // Feedback immédiat au clic
    "active:translate-y-px",
    // Accessibilité : jamais de contenu masqué par l'état désactivé
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-busy:cursor-progress",
    "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        // Action principale : contraste 5.55:1 dans les deux thèmes
        primary:
          "bg-primary-solid text-primary-solid-fg hover:bg-primary-solid-hover",
        // Action secondaire : pilule grise discrète, façon réseau social
        secondary:
          "bg-bg-muted text-fg hover:bg-border",
        // Action discrète
        ghost: "text-fg hover:bg-bg-muted",
        // Lien textuel
        link: "text-primary underline underline-offset-4 decoration-1 hover:decoration-2 px-0",
        // Action destructive (annulation, suppression)
        danger: "bg-danger-solid text-white hover:bg-danger-solid-hover",
        // Accent chaud : réservé aux mises en avant (VIP, CTA promotionnel)
        accent: "bg-accent-solid text-accent-solid-fg hover:brightness-95",
        // Sur photo de couverture (fond sombre garantissant le contraste)
        overlay:
          "bg-black/55 text-white backdrop-blur-sm hover:bg-black/70 border-white/15",
      },
      size: {
        sm: "h-9 px-3 text-sm [&_svg]:size-4",
        md: "h-11 px-4 text-sm [&_svg]:size-4",
        lg: "h-12 px-6 text-base [&_svg]:size-5",
        icon: "size-11 [&_svg]:size-5",
        "icon-sm": "size-9 [&_svg]:size-4",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  /** Affiche un indicateur et bloque les interactions pendant l'action. */
  loading?: boolean;
  /** Texte alternatif pendant le chargement (utile aux lecteurs d'écran). */
  loadingLabel?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, fullWidth, loading = false, loadingLabel, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          {loadingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
});

/* ---------------------------------------------------------------------------
   Variantes pour les liens : mêmes styles, sémantique correcte (navigation).
--------------------------------------------------------------------------- */

export interface ButtonLinkProps
  extends React.ComponentPropsWithoutRef<typeof Link>,
    ButtonVariants {
  className?: string;
}

export function ButtonLink({
  className,
  variant,
  size,
  fullWidth,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    >
      {children}
    </Link>
  );
}