"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { respondToConnection } from "@/lib/connections/actions";

/* Boutons « Accepter » / « Refuser » d'une demande de connexion reçue. */

export function ConnectionActions({ connectionId }: { connectionId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function respond(accept: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await respondToConnection(connectionId, accept);
      if (result.success) router.refresh();
      else setError(result.error ?? "Impossible d'enregistrer ta réponse.");
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => respond(true)}
          disabled={pending}
          className="inline-flex h-9 items-center rounded-md bg-primary-solid px-4 text-sm font-semibold text-primary-solid-fg transition-colors hover:bg-primary-solid-hover disabled:opacity-50"
        >
          Accepter
        </button>
        <button
          type="button"
          onClick={() => respond(false)}
          disabled={pending}
          className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-semibold transition-colors hover:bg-fg hover:text-fg-inverted disabled:opacity-50"
        >
          Refuser
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
