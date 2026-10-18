"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock3, Phone, X } from "lucide-react";

import {
  requestConnectionPhone,
  respondToConnectionPhoneRequest,
} from "@/lib/connections/contact-request-actions";

export function ConnectionContactRequestControl({
  connectionId,
  requestId,
  direction,
  hasSharedPhone,
}: {
  connectionId: string;
  requestId: string | null;
  direction: "incoming" | "outgoing" | null;
  hasSharedPhone: boolean;
}) {
  const router = useRouter();
  const [requestPending, setRequestPending] = useState(Boolean(requestId));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function sendRequest() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await requestConnectionPhone(connectionId);
        if (!result.success) {
          setError(result.error);
          return;
        }
        setRequestPending(true);
        router.refresh();
      } catch {
        setError("La demande n’a pas pu être envoyée. Vérifie ta connexion puis réessaie.");
      }
    });
  }

  function respond(accept: boolean) {
    if (!requestId) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await respondToConnectionPhoneRequest(requestId, accept);
        if (!result.success) {
          setError(result.error);
          return;
        }
        setRequestPending(false);
        router.refresh();
      } catch {
        setError("La réponse n’a pas pu être enregistrée. Vérifie ta connexion puis réessaie.");
      }
    });
  }

  let control = null;
  if (requestPending && direction === "incoming") {
    control = (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => respond(true)}
          disabled={pending}
          className="bg-primary-solid text-primary-solid-fg hover:bg-primary-solid-hover inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-bold shadow-sm transition-colors disabled:opacity-60"
        >
          <Check className="size-4" aria-hidden="true" /> Partager et accepter
        </button>
        <button
          type="button"
          onClick={() => respond(false)}
          disabled={pending}
          className="border-border-strong bg-surface hover:bg-bg-muted inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors disabled:opacity-60"
        >
          <X className="size-4" aria-hidden="true" /> Refuser
        </button>
      </div>
    );
  } else if (requestPending && direction === "outgoing") {
    control = (
      <p className="text-fg-muted inline-flex min-h-10 items-center gap-2 px-2 text-xs font-semibold">
        <Clock3 className="size-4" aria-hidden="true" /> Demande envoyée · en attente
      </p>
    );
  } else if (!hasSharedPhone) {
    control = (
      <button
        type="button"
        onClick={sendRequest}
        disabled={pending}
        className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-bold shadow-sm transition-colors disabled:opacity-60"
      >
        <Phone className="size-4" aria-hidden="true" />
        {pending ? "Envoi…" : "Demander son numéro"}
      </button>
    );
  }

  if (!control && !error) return null;
  return (
    <div className="mt-2">
      {control}
      {error ? (
        <p role="alert" className="text-danger mt-1 text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
