import { cn } from "@/lib/utils";

/* Event's mark is a ticket shape with a center perforation. */

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="Event"
      className={cn(
        "bg-primary-solid text-primary-solid-fg size-8 shrink-0 rounded-[10px] p-1.5 shadow-sm",
        className,
      )}
      fill="currentColor"
    >
      <path d="M8 6.5h16a2.5 2.5 0 0 1 2.5 2.5v4.2a2.8 2.8 0 0 0 0 5.6V23a2.5 2.5 0 0 1-2.5 2.5H8A2.5 2.5 0 0 1 5.5 23v-4.2a2.8 2.8 0 0 0 0-5.6V9A2.5 2.5 0 0 1 8 6.5Z" fill="currentColor" />
      <path d="M18.5 9.5v13" stroke="var(--primary-solid-fg)" strokeWidth="1.5" strokeDasharray="1.8 2.1" strokeLinecap="round" />
      <path d="m12.5 11.2 1.1 2.2 2.4.3-1.7 1.7.4 2.4-2.2-1.1-2.2 1.1.4-2.4L9 13.7l2.4-.3 1.1-2.2Z" fill="var(--primary-solid-fg)" />
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
