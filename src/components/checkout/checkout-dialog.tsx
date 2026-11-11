"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, X } from "lucide-react";

/* Confirmation avant fermeture : un panier rempli ne doit pas disparaître
   sans avertissement (X, Esc ou clic sur l'arrière-plan). Le formulaire se
   déclare « sale » via data-checkout-dirty ; la logique de commande reste
   intacte (aucune donnée n'est supprimée par le dialog lui-même). */
function hasUnsavedCart(dialog: HTMLDialogElement): boolean {
  return Boolean(dialog.querySelector("[data-checkout-dirty='true']"));
}

export function CheckoutDialog({
  children,
  eventTitle,
}: {
  children: ReactNode;
  /** Nom de l'événement, rappelé dans l'en-tête de la modal. */
  eventTitle?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function closeDialog({ force = false }: { force?: boolean } = {}) {
    const dialog = dialogRef.current;
    if (!force && dialog && hasUnsavedCart(dialog)) {
      const leave = window.confirm(
        "Ta commande n'est pas finalisée. Quitter et abandonner les billets choisis ?",
      );
      if (!leave) return;
    }
    router.back();
  }

  return (
    <dialog
      ref={dialogRef}
      className="checkout-dialog"
      aria-labelledby="checkout-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <div className="checkout-dialog-shell">
        <header className="checkout-dialog-header">
          <div className="min-w-0">
            <p className="text-fg-muted flex min-w-0 items-center gap-1.5 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
              <LockKeyhole className="size-3 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {eventTitle ? `${eventTitle} · Paiement sécurisé` : "Paiement sécurisé"}
              </span>
            </p>
            <h2 id="checkout-dialog-title" className="font-display text-xl font-bold sm:text-2xl">
              Finaliser la réservation
            </h2>
          </div>
          <button
            type="button"
            className="checkout-dialog-close"
            aria-label="Fermer le paiement et revenir à l’événement"
            onClick={() => closeDialog()}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>
        <div className="checkout-dialog-body">
          {children}
        </div>
      </div>
    </dialog>
  );
}
