"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";

import { deleteAdminEventAction } from "@/lib/admin/actions";

export function AdminEventDeleteControl({ eventId, title }: { eventId: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function removeEvent() {
    const confirmed = window.confirm(
      `Supprimer « ${title} » ? Si des commandes existent, l'événement sera retiré de la plateforme et l'historique des ventes sera conservé.`,
    );
    if (!confirmed) return;

    setMessage(null);
    startTransition(async () => {
      try {
        const result = await deleteAdminEventAction(eventId);
        setMessage(result.error ?? result.warning ?? result.success ?? "Opération terminée.");
        if (result.success) router.refresh();
      } catch {
        setMessage("L'opération a échoué. Actualisez la page puis réessayez.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <button
        type="button"
        disabled={pending}
        onClick={removeEvent}
        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-danger/40 px-3 text-xs font-semibold text-danger hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
        {pending ? "Traitement…" : "Supprimer"}
      </button>
      {message ? <p role="status" className="max-w-64 text-right text-xs text-fg-muted">{message}</p> : null}
    </div>
  );
}
