"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/constants";
import { haptic } from "@/lib/ui/haptics";
import { cn } from "@/lib/utils";

/* =============================================================================
   Déconnexion — action de compte (client)
   --------------------------------------------------------------------------
   Même logique que l'ancien `MobileNav` (signOut client Supabase puis
   redirection) : la déconnexion reste toujours accessible, elle vit
   désormais dans Règlages du compte (mobile comme desktop).
   ========================================================================== */

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  const handleLogout = async () => {
    haptic("medium");
    setPending(true);
    try {
      await createSupabaseBrowserClient().auth.signOut();
    } finally {
      setPending(false);
      router.push(ROUTES.home);
      startTransition(() => router.refresh());
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "press border-border-strong text-fg inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold",
        "hover:bg-bg-muted disabled:opacity-60",
        className,
      )}
    >
      <LogOut className="size-4" aria-hidden="true" />
      {pending ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}
