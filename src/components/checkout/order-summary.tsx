"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrderPricing } from "@/lib/orders/pricing";
import { formatPrice } from "@/lib/utils";
import { Alert } from "@/components/ui/states";
import type { PaymentProviderName } from "@/lib/payments/types";

/* Récapitulatif de commande (colonne latérale du tunnel d'achat). */

export function OrderSummary({
  pricing,
  pending,
  error,
  paymentProvider,
}: {
  pricing: OrderPricing;
  pending: boolean;
  error: string | null;
  paymentProvider: PaymentProviderName;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Récapitulatif</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {pricing.lines.length === 0 ? (
          <p className="text-fg-muted text-sm">Sélectionne au moins un billet.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {pricing.lines.map((line) => (
              <li key={line.ticketTypeId} className="flex justify-between gap-2">
                <span>
                  {line.quantity} × {line.name}
                </span>
                <span className="font-medium tabular-nums">{formatPrice(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
        )}
        <dl className="border-border flex flex-col gap-1.5 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-fg-muted">Sous-total</dt>
            <dd className="tabular-nums">{formatPrice(pricing.subtotal)}</dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatPrice(pricing.total)}</dd>
          </div>
        </dl>
        {error ? (
          <div role="alert" aria-live="assertive">
            <Alert tone="danger" title="Le paiement n’a pas démarré">
              {error}
            </Alert>
          </div>
        ) : null}
        <Button
          type="submit"
          loading={pending}
          loadingLabel="Création de la commande…"
          fullWidth
          disabled={pricing.lines.length === 0}
        >
          {pricing.total === 0 ? "Obtenir mes billets" : `Payer ${formatPrice(pricing.total)}`}
        </Button>
        <p className="text-fg-subtle text-xs">
          {paymentProvider === "geniuspay"
            ? "Tu choisiras ton moyen de paiement sur la page sécurisée GeniusPay."
            : paymentProvider === "cinetpay"
              ? "Tu choisiras ton moyen de paiement sur la page sécurisée CinetPay."
              : "Mode de simulation : aucun montant réel ne sera débité."}
        </p>
      </CardContent>
    </Card>
  );
}
