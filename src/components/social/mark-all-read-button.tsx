"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, LoaderCircle } from "lucide-react";

import { markAllNotificationsRead } from "@/lib/notifications/actions";

export function MarkAllReadButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        aria-busy={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await markAllNotificationsRead();
            if (!result.success) {
              setError(result.error ?? "Les notifications n’ont pas pu être mises à jour.");
              return;
            }
            router.refresh();
          })
        }
        className="border-border hover:bg-fg hover:text-fg-inverted inline-flex min-h-11 items-center gap-2 rounded-sm border px-4 text-sm font-semibold transition-colors disabled:cursor-progress disabled:opacity-60"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <CheckCheck className="size-4" aria-hidden="true" />
        )}
        {pending ? "Mise à jour…" : "Tout marquer comme lu"}
      </button>
      {error ? (
        <p role="alert" className="text-danger mt-2 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
