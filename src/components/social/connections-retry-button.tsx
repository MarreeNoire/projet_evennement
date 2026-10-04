"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function ConnectionsRetryButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-fg transition-colors hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:cursor-wait disabled:opacity-60"
    >
      <RefreshCw className={isPending ? "size-4 animate-spin" : "size-4"} aria-hidden="true" />
      {isPending ? "Actualisation…" : "Réessayer"}
    </button>
  );
}
