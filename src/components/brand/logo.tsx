import { cn } from "@/lib/utils";

/* =============================================================================
   Signature visuelle « Rassemble »
   --------------------------------------------------------------------------
   Marque = deux arcs qui se rejoignent : la rencontre entre un événement et sa
   communauté. Construite en SVG pour rester nette à toutes les tailles et
   hériter de la couleur du texte.
   ========================================================================== */

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="Rassemble"
      className={cn("size-8", className)}
      fill="none"
    >
      {/* Arc gauche : le participant */}
      <path
        d="M6 26V14a10 10 0 0 1 10-10"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
      />
      {/* Arc droit : la communauté */}
      <path
        d="M26 26V14a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* Point de rencontre */}
      <circle cx="16" cy="24" r="3.25" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-primary", className)}>
      <LogoMark className="size-7" />
      {showWordmark ? (
        <span className="font-display text-lg leading-none font-bold tracking-tight text-fg">
          Rassemble
        </span>
      ) : null}
    </span>
  );
}