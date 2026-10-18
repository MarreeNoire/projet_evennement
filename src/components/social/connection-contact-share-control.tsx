"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, PhoneOff } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ConnectionContactShareControl({
  connectionId,
  initialSharing,
  canShare,
}: {
  connectionId: string;
  initialSharing: boolean;
  canShare: boolean;
}) {
  const router = useRouter();
  const [sharing, setSharing] = useState(initialSharing);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleSharing() {
    setError(null);
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data.user) {
          setError("Reconnecte-toi pour modifier ce partage.");
          return;
        }

        const nextSharing = !sharing;
        const result = nextSharing
          ? await supabase.from("connection_contact_shares").insert({
              connection_id: connectionId,
              owner_id: data.user.id,
            })
          : await supabase
              .from("connection_contact_shares")
              .delete()
              .eq("connection_id", connectionId)
              .eq("owner_id", data.user.id);

        if (result.error) {
          setError("Le partage n’a pas pu être modifié. Réessaie.");
          return;
        }

        setSharing(nextSharing);
        router.refresh();
      } catch {
        setError("Le partage n’a pas pu être modifié. Réessaie.");
      }
    });
  }

  if (!canShare) {
    return (
      <p className="text-fg-subtle text-xs">
        Ajoute ton numéro dans{" "}
        <Link href="/profil" className="text-primary underline">
          Mon profil
        </Link>{" "}
        pour le partager.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggleSharing}
        disabled={pending}
        aria-pressed={sharing}
        className="text-fg-muted hover:bg-bg-muted hover:text-primary inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold transition-colors disabled:opacity-60"
      >
        {sharing ? (
          <PhoneOff className="size-4" aria-hidden="true" />
        ) : (
          <Phone className="size-4" aria-hidden="true" />
        )}
        {pending
          ? "Mise à jour…"
          : sharing
            ? "Ne plus partager mon numéro"
            : "Partager mon numéro avec cette personne"}
      </button>
      {error ? (
        <p role="alert" className="text-danger px-2 text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
