"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, CircleOff } from "lucide-react";

import { setProfileVerificationAction } from "@/lib/admin/actions";

export function ProfileVerificationControl({ userId, isVerified }: { userId: string; isVerified: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function changeVerification(verified: boolean) {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await setProfileVerificationAction(userId, verified);
        setMessage(result.error ?? result.success ?? "Mis à jour.");
      } catch {
        setMessage("La mise à jour a échoué. Actualisez la page puis réessayez.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <button type="button" disabled={pending} onClick={() => changeVerification(!isVerified)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-fg hover:bg-bg-muted disabled:opacity-60">
        {isVerified ? <CircleOff className="size-4" aria-hidden="true" /> : <BadgeCheck className="size-4" aria-hidden="true" />}
        {isVerified ? "Retirer la vérification" : "Vérifier ce profil"}
      </button>
      {message ? <p role="status" className="max-w-sm text-xs text-fg-muted">{message}</p> : null}
    </div>
  );
}
