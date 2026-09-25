import { cn } from "@/lib/utils";

/* =============================================================================
   Carte
   --------------------------------------------------------------------------
   Brique de base des listes et des tableaux de bord. Filet fin sur papier, pas
   d'ombre : la hiérarchie vient de la typographie et de l'espacement, pas de
   l'empilement d'élévations.
   ========================================================================== */

export function Card({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface",
        interactive &&
          "transition-[border-color,background-color] duration-150 ease-[var(--ease-out-soft)] hover:border-border hover:bg-surface-raised focus-within:border-border-focus",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-5 pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg leading-tight font-semibold", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-fg-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-3 border-t border-border px-5 py-4", className)}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------------------
   Statistique de tableau de bord
--------------------------------------------------------------------------- */

export function StatCard({
  label,
  value,
  hint,
  icon,
  trend,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  /** Variation par rapport à la période précédente, ex. « +12 % ». */
  trend?: { value: string; direction: "up" | "down" | "flat" };
  className?: string;
}) {
  const trendColor =
    trend?.direction === "up"
      ? "text-success"
      : trend?.direction === "down"
        ? "text-danger"
        : "text-fg-muted";

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{label}</p>
        {icon ? (
          <span className="text-fg-subtle" aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {(hint || trend) && (
        <p className="mt-1 flex items-center gap-1.5 text-xs">
          {trend ? (
            <span className={cn("font-semibold tabular-nums", trendColor)}>
              {trend.direction === "up" ? "▲" : trend.direction === "down" ? "▼" : "■"}{" "}
              {trend.value}
            </span>
          ) : null}
          {hint ? <span className="text-fg-subtle">{hint}</span> : null}
        </p>
      )}
    </Card>
  );
}