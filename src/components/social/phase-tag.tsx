import { cn } from "@/lib/utils";
import { PHASE_LABELS, type EventPhase } from "@/lib/social/phase";

/* Étiquette de phase : jaune avant, latérite pleine (avec point qui pulse) en direct, gris après. */

const STYLES: Record<EventPhase, string> = {
  avant: "border-accent/40 bg-accent-subtle text-accent-subtle-fg",
  live: "border-transparent bg-primary-solid text-primary-solid-fg",
  apres: "border-border-strong bg-bg-muted text-fg-muted",
};

export function PhaseTag({
  phase,
  label,
  className,
}: {
  phase: EventPhase;
  /** Remplace le libellé par défaut (ex. « Dans 3 jours »). */
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-2xs font-semibold tracking-[0.08em] whitespace-nowrap uppercase",
        STYLES[phase],
        className,
      )}
    >
      {phase === "live" ? (
        <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-current" />
      ) : null}
      {label ?? PHASE_LABELS[phase]}
    </span>
  );
}
