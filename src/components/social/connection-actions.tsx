"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { respondToConnection } from "@/lib/connections/actions";

/* Boutons « Accepter » / « Refuser » d'une demande de connexion reçue. */

export function ConnectionActions({ connectionId }: { connectionId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [responding, setResponding] = useState<boolean | null>(null);

  function respond(accept: boolean) {
    setError(null);
    setResponding(accept);
    startTransition(async () => {
      const result = await respondToConnection(connectionId, accept);
      if (result.success) router.refresh();
      else {
        setResponding(null);
        setError(result.error ?? "Impossible d'enregistrer ta réponse.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => respond(true)}
          disabled={pending}
          aria-busy={pending}
          className="bg-primary-solid text-primary-solid-fg hover:bg-primary-solid-hover inline-flex min-h-11 items-center gap-2 rounded-sm px-4 text-sm font-semibold transition-colors disabled:cursor-progress disabled:opacity-60"
        >
          {pending && responding === true ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {pending && responding === true ? "Acceptation…" : "Accepter"}
        </button>
        <button
          type="button"
          onClick={() => respond(false)}
          disabled={pending}
          aria-busy={pending}
          className="border-border hover:bg-fg hover:text-fg-inverted inline-flex min-h-11 items-center gap-2 rounded-sm border px-4 text-sm font-semibold transition-colors disabled:cursor-progress disabled:opacity-60"
        >
          {pending && responding === false ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {pending && responding === false ? "Refus…" : "Refuser"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-danger text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
