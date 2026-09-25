"use client";

import { useState, useTransition } from "react";
import { UserPlus, Check } from "lucide-react";

import { requestConnection } from "@/lib/connections/actions";
import { cn } from "@/lib/utils";

export function RequestConnectionButton({ profileId }: { profileId: string }) {
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (state === "sent") {
    return (
      <span className="inline-flex h-10 items-center gap-2 rounded-md border border-success px-4 text-sm font-semibold text-success">
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
          "inline-flex h-10 items-center gap-2 rounded-md bg-primary-solid px-4 text-sm font-semibold text-primary-solid-fg transition-colors hover:bg-primary-solid-hover disabled:opacity-50",
        )}
      >
        <UserPlus className="size-4" aria-hidden="true" />
        Se connecter
      </button>
      {state === "error" && error ? (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
