"use client";

import { useState, useTransition } from "react";
import { EyeOff, X } from "lucide-react";

import { resolveReportAction } from "@/lib/admin/actions";

export function ReportActions({ reportId, canHide }: { reportId: string; canHide: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function resolve(status: "resolved" | "dismissed", hideTarget: boolean) {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await resolveReportAction(reportId, status, hideTarget);
        setMessage(result.error ?? result.success ?? "Terminé.");
      } catch {
        setMessage("Le traitement a échoué. Réessayez.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => resolve("resolved", canHide)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-danger px-3 text-xs font-semibold text-white disabled:opacity-60"><EyeOff className="size-4" /> Traiter{canHide ? " et masquer" : ""}</button>
        <button type="button" disabled={pending} onClick={() => resolve("dismissed", false)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold text-fg hover:bg-bg-muted disabled:opacity-60"><X className="size-4" /> Rejeter</button>
      </div>
      {message ? <p role="status" className="max-w-xs text-xs text-fg-muted">{message}</p> : null}
    </div>
  );
}
