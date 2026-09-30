"use client";

import { useState, useTransition } from "react";
import { Check, RotateCw, Wallet } from "lucide-react";

import { updatePayoutAction } from "@/lib/admin/actions";

export function PayoutControls({ payoutId, status }: { payoutId: string; status: string }) {
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update(nextStatus: "processing" | "paid" | "failed") {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await updatePayoutAction(payoutId, nextStatus, reference);
        if (result.error) setMessage(result.error);
        else {
          setMessage(result.success ?? "Mis à jour.");
          setReference("");
        }
      } catch {
        setMessage("L'action a échoué. Actualisez la page puis réessayez.");
      }
    });
  }

  return (
    <div className="min-w-52 space-y-2">
      {status === "pending" ? (
        <button type="button" disabled={pending} onClick={() => update("processing")} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold text-fg hover:bg-bg-muted disabled:opacity-60"><Wallet className="size-4" /> Démarrer</button>
      ) : status === "processing" ? (
        <>
          <label className="sr-only" htmlFor={`payout-ref-${payoutId}`}>Référence du transfert</label>
          <input id={`payout-ref-${payoutId}`} value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Référence du transfert" maxLength={120} className="h-10 w-full rounded-md border border-border bg-surface px-2 text-xs text-fg" />
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={pending || reference.trim().length < 3} onClick={() => update("paid")} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-success px-3 text-xs font-semibold text-white disabled:opacity-50"><Check className="size-4" /> Marquer versé</button>
            <button type="button" disabled={pending} onClick={() => update("failed")} className="min-h-10 rounded-lg border border-border px-3 text-xs font-semibold text-fg hover:bg-bg-muted disabled:opacity-60">Échec</button>
          </div>
        </>
      ) : status === "failed" ? (
        <button type="button" disabled={pending} onClick={() => update("processing")} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold text-fg hover:bg-bg-muted disabled:opacity-60"><RotateCw className="size-4" /> Relancer</button>
      ) : <span className="text-xs text-fg-muted">Aucune action disponible</span>}
      {message ? <p role="status" className="max-w-xs text-xs text-fg-muted">{message}</p> : null}
    </div>
  );
}
