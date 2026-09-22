import { cn } from "@/lib/utils";

/* =============================================================================
   États vide, erreur et messages
   --------------------------------------------------------------------------
   Chaque liste ou tableau de bord couvre quatre états : chargement, vide (avec
   une action utile), erreur (avec reprise), puis données.
   ========================================================================== */

/* ------------------------------ État vide -------------------------------- */

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Toujours proposer une suite : créer, explorer, inviter… */
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <span
          className="mb-4 flex size-12 items-center justify-center rounded-full bg-bg-muted text-fg-subtle [&_svg]:size-6"
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      <p className="font-display text-lg font-semibold">{title}</p>
      {description ? <p className="mt-1.5 max-w-md text-sm text-fg-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/* ---------------------------- État d'erreur ------------------------------- */

export function ErrorState({
  title = "Une erreur est survenue",
  description = "Le contenu n'a pas pu être chargé. Merci de réessayer.",
  onRetry,
  retryLabel = "Réessayer",
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-danger/30 bg-danger-subtle px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-3 text-danger" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          className="size-8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
          />
        </svg>
      </span>
      <p className="font-display text-base font-semibold text-fg">{title}</p>
      <p className="mt-1.5 max-w-md text-sm text-fg-muted">{description}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:bg-bg-muted"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

/* -------------------------------- Alerte --------------------------------- */

const ALERT_TONES = {
  info: { wrapper: "border-info/25 bg-info-subtle text-info", symbol: "i" },
  success: { wrapper: "border-success/25 bg-success-subtle text-success", symbol: "✓" },
  warning: { wrapper: "border-warning/25 bg-warning-subtle text-warning", symbol: "!" },
  danger: { wrapper: "border-danger/25 bg-danger-subtle text-danger", symbol: "×" },
  neutral: { wrapper: "border-border bg-bg-muted text-fg-muted", symbol: "•" },
} as const;

export interface AlertProps {
  tone?: keyof typeof ALERT_TONES;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ tone = "info", title, children, className }: AlertProps) {
  const styles = ALERT_TONES[tone];

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-xl border p-4 text-sm", styles.wrapper, className)}
    >
      {/* Symbole + texte : l'information n'est jamais portée par la couleur seule */}
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold"
      >
        {styles.symbol}
      </span>
      <div className="flex flex-col gap-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className="leading-relaxed opacity-95">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------- Bandeau mode démonstration --------------------- */

/**
 * Avertissement lorsque l'application tourne sans prestataires réels.
 * Volontairement visible : il ne doit jamais être possible de croire qu'on
 * encaisse réellement ou qu'un email vient de partir.
 */
export function DemoModeBanner({
  paymentsMock,
  emailConsole,
}: {
  paymentsMock: boolean;
  emailConsole: boolean;
}) {
  if (!paymentsMock && !emailConsole) return null;

  const parts = [
    paymentsMock ? "paiements simulés" : null,
    emailConsole ? "emails non envoyés" : null,
  ].filter(Boolean);

  return (
    <div
      role="status"
      className="border-b border-warning/30 bg-warning-subtle px-4 py-2 text-center text-xs font-medium text-warning"
    >
      Mode démonstration : {parts.join(" · ")}. Renseigne les clés pour passer en réel.
    </div>
  );
}