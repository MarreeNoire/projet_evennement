"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { haptic } from "@/lib/ui/haptics";
import { cn } from "@/lib/utils";

/* =============================================================================
   Bottom sheet — présentation « app native » sur mobile
   --------------------------------------------------------------------------
   Une feuille glisse depuis le bas, se ferme d'un glisser vers le bas, au clic
   sur le fond ou avec Échap. Sur tablette et au-delà, elle devient un panneau
   centré (md:), conforme aux attentes desktop. Focus renvoyé au déclencheur.

   `variant="menu"` habille la feuille de compte : titre serif, croix ronde,
   corps pleine largeur pour les lignes de menu. La variante par défaut reste
   celle de la recherche et des filtres.
   ========================================================================== */

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** Label accessible du panneau (role="dialog", souvent le titre visible). */
  title: string;
  /** Libellé de la poignée pour l'accessibilité : « Fermer les filtres ». */
  closeLabel?: string;
  /** Habillage : panneau applicatif (défaut) ou feuille de menu éditoriale. */
  variant?: "default" | "menu";
  /** Classe de portée appliquée au portail (jetons de couleur du lieu d'origine). */
  scopeClassName?: string;
  children: React.ReactNode;
}

export function BottomSheet({
  open,
  onClose,
  title,
  closeLabel,
  variant = "default",
  scopeClassName,
  children,
}: BottomSheetProps) {
  const [closeDrag, setCloseDrag] = useState(0);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const dragStartRef = useRef<number | null>(null);
  const dragLastRef = useRef<{ y: number; time: number } | null>(null);
  const velocityRef = useRef(0);
  const isMenu = variant === "menu";

  /* Portal + verrou de défilement + raccourci Échap. */
  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement as HTMLElement | null;

    const bodyLock = document.body.style.overflow;
    const sheetNode = sheetRef.current;
    if (sheetNode) sheetNode.style.transform = "translateY(0px)";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    /* La feuille enfonce légèrement le doigt au premier rendu. */
    requestAnimationFrame(() => {
      sheetRef.current?.style.removeProperty("transform");
    });

    return () => {
      document.body.style.overflow = bodyLock;
      document.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  /* Glisser la poignée vers le bas = fermeture naturelle.
     Continu, sans re-render React : la translation est écrite directement.
     Fermeture au-delà d'un quart de la hauteur ou sur un geste rapide. */
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = event.clientY;
    dragLastRef.current = { y: event.clientY, time: performance.now() };
    velocityRef.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current === null) return;
    const delta = Math.max(0, event.clientY - dragStartRef.current);
    const now = performance.now();
    const last = dragLastRef.current;
    if (last) {
      const elapsed = now - last.time;
      if (elapsed > 0) velocityRef.current = (event.clientY - last.y) / elapsed;
    }
    dragLastRef.current = { y: event.clientY, time: now };

    setCloseDrag(delta);
    const node = sheetRef.current;
    if (node) {
      node.style.transform = `translateY(${delta}px)`;
      node.style.transition = "none";
    }
  };

  const onPointerUp = () => {
    if (dragStartRef.current === null) return;
    dragStartRef.current = null;
    const node = sheetRef.current;
    const height = node?.offsetHeight ?? 0;
    if (node) node.style.transition = "";
    if (closeDrag > Math.max(90, height * 0.25) || velocityRef.current > 0.6) {
      haptic("light");
      onClose();
    }
    dragLastRef.current = null;
    velocityRef.current = 0;
    setCloseDrag(0);
  };

  if (!open) return null;

  return createPortal(
    <div className={cn("pointer-events-none fixed inset-0 z-[70]", scopeClassName)}>
      {/* Fond tapable pour fermer (fondu, désactivé si reduced-motion). */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "pointer-events-auto absolute inset-0 motion-reduce:transition-none",
          isMenu ? "bg-void-950/40" : "bg-void-950/55",
        )}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        data-state={closeDrag > 0 ? "dragging" : "open"}
        className={cn(
          "bg-surface border-border pointer-events-auto absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto overscroll-contain",
          isMenu
            ? "rounded-t-[26px] border-t shadow-[0_-24px_60px_rgba(10,8,18,0.4)]"
            : "rounded-t-2xl border-t shadow-[0_-24px_60px_rgba(10,8,18,0.4)]",
          "md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-[min(32rem,calc(100vw-4rem))] md:max-h-[85dvh] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border",
          "transition-transform duration-200 ease-[var(--ease-out-soft)] motion-reduce:transition-none",
        )}
        style={{
          paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
          /* Le panneau doit rester défilable au doigt (formulaires longs) ;
             seule la poignée capte le geste de fermeture. */
          touchAction: "pan-y",
        }}
      >
        <div
          className="text-fg-subtle mx-auto flex h-6 w-full touch-none items-center justify-center md:hidden"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          aria-hidden="true"
        >
          <span className="bg-border-strong h-1.5 w-10 rounded-full" />
        </div>

        {isMenu ? (
          <>
            <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-1">
              <h2 className="font-display text-fg px-1 text-[21px] font-semibold tracking-tight">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel ?? `Fermer : ${title}`}
                className="bg-bg-muted text-fg-muted press inline-flex size-10 shrink-0 items-center justify-center rounded-full"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
                </svg>
                <span className="sr-only">{closeLabel ?? `Fermer : ${title}`}</span>
              </button>
            </div>
            <div className="pb-1">{children}</div>
          </>
        ) : (
          <div className="px-4 sm:px-6">
            <div className="border-border-strong flex items-center justify-between gap-4 border-b pb-3 pt-1">
              <h2 className="text-fg text-base font-bold tracking-tight">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel ?? `Fermer : ${title}`}
                className="text-fg-muted hover:bg-bg-muted press inline-flex size-11 shrink-0 items-center justify-center rounded-full"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
                </svg>
                <span className="sr-only">{closeLabel ?? `Fermer : ${title}`}</span>
              </button>
            </div>
            <div className="py-4">{children}</div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
