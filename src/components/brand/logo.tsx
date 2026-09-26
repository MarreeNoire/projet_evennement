import { cn } from "@/lib/utils";

/* =============================================================================
   Signature visuelle « Event »
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
      aria-label="Event"
      className={cn("size-8", className)}
      fill="none"
    >
      {/* Arc gauche : le participant */}
      <path d="M6 27V5h9M26 27V5h-9" stroke="currentColor" strokeWidth="3" />
      <path d="M12 21h8v8h-8z" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-primary", className)}>
      <LogoMark className="size-7" />
      {showWordmark ? (
        <span className="font-display text-lg leading-none font-bold tracking-tight text-fg">
          Event
        </span>
      ) : null}
    </span>
  );
}
