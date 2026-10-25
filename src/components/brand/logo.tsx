import { cn } from "@/lib/utils";

/* =============================================================================
   Marque Event
   --------------------------------------------------------------------------
   Tuile encre + « e » italique + mot-symbole serif minuscule + point vermillon.
   Même dessin que l'en-tête éditorial public, pour que le chrome applicatif
   (espace membre, /org, /admin) parle la même langue visuelle.
   ========================================================================== */

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "bg-fg text-bg font-display grid size-8 shrink-0 place-items-center rounded-[4px] text-[20px] italic leading-none",
        className,
      )}
    >
      e
    </span>
  );
}

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <LogoMark className="size-7 translate-y-[2px]" />
      {showWordmark ? (
        <>
          <span className="font-display text-fg text-[22px] font-bold leading-none tracking-[-0.045em]">
            event
          </span>
          <span
            aria-hidden="true"
            className="bg-primary size-[5px] -translate-y-[6px] rounded-full"
          />
        </>
      ) : null}
    </span>
  );
}
