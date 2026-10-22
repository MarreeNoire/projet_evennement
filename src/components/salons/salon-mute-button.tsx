"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, LoaderCircle } from "lucide-react";

import { setSalonMuted } from "@/lib/salons/actions";
import { cn } from "@/lib/utils";

/* =============================================================================
   Notifications du salon (étape D)
   --------------------------------------------------------------------------
   Le bouton bascule la surdine du salon pour le membre courant
   (salon_members.is_muted, ligne personnelle uniquement). Optimiste avec
   retour arrière en cas d'échec ; l'état est rafraîchi côté serveur ensuite.
   ========================================================================== */

export function SalonMuteButton({
  salonId,
  muted,
}: {
  salonId: string;
  muted: boolean;
}) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState(muted);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !optimistic;
    setOptimistic(next);
    startTransition(async () => {
      const result = await setSalonMuted(salonId, next);
      if (!result.success) {
        setOptimistic(!next);
        return;
      }
      router.refresh();
    });
  };

  const isMuted = optimistic || pending;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isMuted}
      aria-label={isMuted ? "Réactiver les notifications du salon" : "Suspendre les notifications du salon"}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors duration-150",
        isMuted
          ? "border-border bg-surface text-fg-muted hover:bg-bg-muted hover:text-fg"
          : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15",
      )}
    >
      {pending ? (
        <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
      ) : isMuted ? (
        <BellOff className="size-3.5" aria-hidden="true" />
      ) : (
        <Bell className="size-3.5" aria-hidden="true" />
      )}
      {isMuted ? "Notifications coupées" : "Notifications actives"}
    </button>
  );
}
