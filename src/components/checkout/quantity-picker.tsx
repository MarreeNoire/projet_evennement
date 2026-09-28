"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AccessLevelBadge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { TicketTypeRow } from "@/types/database";

/* Sélecteur de quantité pour un type de billet (accessible, borné). */

export function QuantityPicker({
  ticketType,
  quantity,
  disabled = false,
  onChange,
}: {
  ticketType: TicketTypeRow;
  quantity: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const remaining = ticketType.quantity - ticketType.sold_count;
  const max = Math.min(ticketType.max_per_order, Math.max(remaining, 0));

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-4">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-medium">
          {ticketType.name}
          <AccessLevelBadge level={ticketType.access_level} />
        </p>
        <p className="text-sm font-semibold tabular-nums">
          {ticketType.price <= 0 ? "Gratuit" : formatPrice(ticketType.price)}
        </p>
        <p className="text-xs text-fg-subtle">
          {remaining <= 0 ? "Épuisé" : remaining <= 20 ? `Plus que ${remaining}` : `${remaining} disponibles`}
        </p>
      </div>
      <div className="flex items-center gap-2" role="group" aria-label={`Quantité pour ${ticketType.name}`}>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          disabled={disabled || quantity <= 0}
          onClick={() => onChange(Math.max(quantity - 1, 0))}
          aria-label={`Retirer un billet ${ticketType.name}`}
        >
          <Minus className="size-4" aria-hidden="true" />
        </Button>
        <span className="w-8 text-center font-semibold tabular-nums" role="status">
          {quantity}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
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
