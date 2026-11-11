"use client";

import { Minus, Plus } from "lucide-react";

import { AccessLevelBadge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { TicketTypeRow } from "@/types/database";

/* =============================================================================
   Sélecteur de quantité d'un type de billet
   --------------------------------------------------------------------------
   - La ligne choisie se lit d'un coup d'œil : bordure et fond teintés, jamais
     la couleur seule (le sous-total apparaît aussi).
   - Boutons ronds de 44 px, séparés par le compteur : on ne touche pas « + »
     en visant « − ».
   - Hiérarchie nom > prix > disponibilité ; le badge d'accès n'est affiché que
     s'il apporte une information (niveau supérieur à « standard »).
   - Limite atteinte et épuisement expliqués en toutes lettres.
   ========================================================================== */

export function QuantityPicker({
  ticketType,
  quantity,
  disabled = false,
  compact = false,
  onChange,
}: {
  ticketType: TicketTypeRow;
  quantity: number;
  disabled?: boolean;
  compact?: boolean;
  onChange: (value: number) => void;
}) {
  const remaining = ticketType.quantity - ticketType.sold_count;
  const soldOut = remaining <= 0;
  const max = Math.min(ticketType.max_per_order, Math.max(remaining, 0));
  const lowStock = !soldOut && remaining <= 20;
  const atMax = !soldOut && quantity >= max && max > 0;
  const free = ticketType.price <= 0;

  return (
    <div
      data-selected={quantity > 0}
      data-soldout={soldOut}
      className={`border-border bg-surface data-[selected=true]:border-primary data-[selected=true]:bg-primary-subtle flex items-center gap-3 rounded-xl border transition-colors duration-150 data-[soldout=true]:opacity-60 ${
        compact ? "px-3 py-2.5" : "px-3.5 py-3.5 sm:px-4"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="leading-tight font-semibold">{ticketType.name}</p>
          {ticketType.access_level !== "standard" ? (
            <AccessLevelBadge level={ticketType.access_level} />
          ) : null}
        </div>

        <p className="mt-1 text-sm">
          <span className="font-semibold whitespace-nowrap tabular-nums">
            {free ? "Gratuit" : formatPrice(ticketType.price)}
          </span>
          <span
            className={`ml-1.5 text-xs whitespace-nowrap ${
              soldOut ? "text-danger font-medium" : lowStock ? "text-warning font-medium" : "text-fg-subtle"
            }`}
          >
            {soldOut
              ? "· Épuisé"
              : lowStock
                ? `· Plus que ${remaining}`
                : compact
                  ? ""
                  : `· ${remaining} disponibles`}
          </span>
        </p>

        {quantity > 0 && !free ? (
          <p className="text-fg-muted mt-1 text-xs tabular-nums">
            Sous-total{" "}
            <span className="text-fg font-semibold">{formatPrice(ticketType.price * quantity)}</span>
          </p>
        ) : null}

        {atMax ? (
          <p className="text-fg-subtle mt-1 text-xs">
            Maximum {max} par commande
          </p>
        ) : null}
      </div>

      <div
        className="flex flex-none items-center gap-1.5"
        role="group"
        aria-label={`Quantité pour ${ticketType.name}`}
      >
        <button
          type="button"
          disabled={disabled || quantity <= 0}
          onClick={() => onChange(Math.max(quantity - 1, 0))}
          aria-label={`Retirer un billet ${ticketType.name}`}
          className="border-border-strong bg-bg text-fg hover:border-fg focus-visible:outline-border-focus inline-flex size-11 items-center justify-center rounded-full border transition-[transform,border-color,opacity] duration-150 active:scale-90 disabled:pointer-events-none disabled:opacity-35"
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>

        <span
          className="min-w-9 text-center text-lg font-bold tabular-nums"
          role="status"
          aria-live="polite"
          aria-label={`${quantity} billet${quantity > 1 ? "s" : ""} ${ticketType.name}`}
        >
          {quantity}
        </span>

        <button
          type="button"
          disabled={disabled || soldOut || quantity >= max}
          onClick={() => onChange(Math.min(quantity + 1, max))}
          aria-label={`Ajouter un billet ${ticketType.name}`}
          className="bg-primary-solid text-primary-solid-fg hover:bg-primary-solid-hover focus-visible:outline-border-focus inline-flex size-11 items-center justify-center rounded-full transition-[transform,background-color,opacity] duration-150 active:scale-90 disabled:pointer-events-none disabled:opacity-35"
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
