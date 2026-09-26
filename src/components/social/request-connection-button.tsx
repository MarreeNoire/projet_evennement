"use client";

import { useState, useTransition } from "react";
import { UserPlus, Check, LoaderCircle } from "lucide-react";

import { requestConnection } from "@/lib/connections/actions";
import { cn } from "@/lib/utils";

export function RequestConnectionButton({ profileId }: { profileId: string }) {
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (state === "sent") {
    return (
      <span className="border-success text-success inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-semibold">
        <Check className="size-4" aria-hidden="true" />
        Demande envoyée
      </span>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={pending}
        aria-busy={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await requestConnection(profileId);
            if (result.success) setState("sent");
            else {
              setState("error");
              setError(result.error ?? "Impossible d'envoyer la demande.");
            }
          })
        }
        className={cn(
          "bg-primary-solid text-primary-solid-fg hover:bg-primary-solid-hover inline-flex min-h-11 items-center gap-2 rounded-sm px-4 text-sm font-semibold transition-colors disabled:cursor-progress disabled:opacity-60",
        )}
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <UserPlus className="size-4" aria-hidden="true" />
        )}
        {pending ? "Envoi…" : "Se connecter"}
      </button>
      {state === "error" && error ? (
        <p role="alert" className="text-danger text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
