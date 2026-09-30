"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Ban, Check, LoaderCircle } from "lucide-react";

import { setUserBanAction } from "@/lib/admin/actions";

export function UserBanControl({
  userId,
  userName,
  isBanned,
}: {
  userId: string;
  userName: string;
  isBanned: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const nextBanned = !isBanned;

  function changeBanStatus() {
    const confirmed = window.confirm(
      nextBanned
        ? `Bannir ${userName} ? Cette personne ne pourra plus ouvrir de nouvelle session. Tu pourras lever le bannissement depuis cette fiche.`
        : `Lever le bannissement de ${userName} ? Cette personne pourra se reconnecter.`,
    );
    if (!confirmed) return;

    setMessage(null);
    startTransition(async () => {
      try {
        const result = await setUserBanAction(userId, nextBanned);
        setMessage(result.error ?? result.success ?? "Statut mis à jour.");
        if (result.success) router.refresh();
      } catch {
        setMessage("Le statut du compte n'a pas pu être modifié. Actualisez puis réessayez.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={changeBanStatus}
        className={`inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 ${
          isBanned
            ? "border-border text-fg hover:bg-bg-muted focus-visible:outline-border-focus"
            : "border-danger/40 text-danger hover:bg-danger/10 focus-visible:outline-danger"
        }`}
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : isBanned ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <Ban className="size-4" aria-hidden="true" />
        )}
        {pending ? "Mise à jour…" : isBanned ? "Lever le bannissement" : "Bannir cet utilisateur"}
      </button>
      {message ? <p role="status" className="max-w-lg text-sm text-fg-muted">{message}</p> : null}
    </div>
  );
}
