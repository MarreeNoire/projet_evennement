"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AccessLevelBadge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { TicketTypeRow } from "@/types/database";

/* Sélecteur de quantité pour un type de billet.
   Cibles tactiles de 44 px, hiérarchie nom > prix > disponibilité, et badge
   d'accès affiché seulement quand il apporte une information (niveau premium
   ou supérieur) : sur mobile, « Standard » sur chaque ligne encombrait le nom. */

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
  const max = Math.min(ticketType.max_per_order, Math.max(remaining, 0));
  const lowStock = remaining > 0 && remaining <= 20;
  const plusBlockedReason =
    remaining <= 0
      ? "épuisé"
      : quantity >= max
        ? `maximum ${max} par commande`
        : null;

  return (
    <div
      className={`border-border flex items-center gap-3 rounded-xl border ${compact ? "px-2.5 py-2" : "px-3 py-3 sm:px-4"}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="leading-tight font-medium">{ticketType.name}</p>
          {ticketType.access_level !== "standard" ? (
            <AccessLevelBadge level={ticketType.access_level} />
          ) : null}
        </div>
        <p className="mt-0.5 text-sm">
          <span className="font-semibold whitespace-nowrap tabular-nums">
            {ticketType.price <= 0 ? "Gratuit" : formatPrice(ticketType.price)}
          </span>
          {!compact ? (
            <span
              className={`ml-1.5 whitespace-nowrap ${lowStock ? "text-warning font-medium" : "text-fg-subtle"}`}
            >
              ·{" "}
              {remaining <= 0
                ? "épuisé"
                : lowStock
                  ? `plus que ${remaining}`
                  : `${remaining} dispo.`}
            </span>
          ) : remaining <= 0 ? (
            <span className="text-warning ml-1.5 whitespace-nowrap">· épuisé</span>
          ) : null}
        </p>
        {plusBlockedReason && remaining > 0 ? (
          <p className="text-fg-muted mt-0.5 text-xs">{plusBlockedReason}</p>
        ) : null}
      </div>

      <div
        className="flex flex-none items-center gap-1"
        role="group"
        aria-label={`Quantité pour ${ticketType.name}`}
      >
        <Button
          type="button"
          variant="secondary"
          size="icon"
          disabled={disabled || quantity <= 0}
          onClick={() => onChange(Math.max(quantity - 1, 0))}
          aria-label={`Retirer un billet ${ticketType.name}`}
        >
          <Minus className="size-4" aria-hidden="true" />
        </Button>
        <input
          className="border-border w-9 border-0 bg-transparent text-center text-base font-semibold tabular-nums outline-none [appearance:textfield] focus-visible:ring-2 focus-visible:ring-border-focus/35 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          type="number"
          inputMode="numeric"
          min={0}
          max={max}
          value={quantity}
          disabled={disabled || remaining <= 0}
          aria-label={`Quantité pour ${ticketType.name}`}
          onChange={(event) => {
            const parsed = Number.parseInt(event.target.value, 10);
            if (Number.isNaN(parsed)) return;
            onChange(Math.min(Math.max(parsed, 0), max));
          }}
          onBlur={(event) => {
            const parsed = Number.parseInt(event.target.value, 10);
            if (event.target.value === "" || Number.isNaN(parsed)) onChange(0);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          disabled={disabled || quantity >= max || remaining <= 0}
          onClick={() => onChange(Math.min(quantity + 1, max))}
          aria-label={`Ajouter un billet ${ticketType.name}`}
        >
          <Plus className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
