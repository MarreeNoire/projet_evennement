"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";

import { markAllNotificationsRead } from "@/lib/notifications/actions";

export function MarkAllReadButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markAllNotificationsRead();
          router.refresh();
        })
      }
      className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold transition-colors hover:bg-fg hover:text-fg-inverted disabled:opacity-50"
    >
      <CheckCheck className="size-4" aria-hidden="true" />
      Tout marquer comme lu
    </button>
  );
}
