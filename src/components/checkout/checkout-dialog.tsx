"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export function CheckoutDialog({
  children,
}: {
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function closeDialog() {
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
          <h2 id="checkout-dialog-title" className="font-display text-xl font-bold sm:text-2xl">
            Finaliser la réservation
          </h2>
          <button
            type="button"
            className="checkout-dialog-close"
            aria-label="Fermer le paiement et revenir à l’événement"
            onClick={closeDialog}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>
        <div className="checkout-dialog-body">{children}</div>
      </div>
    </dialog>
  );
}
