"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, fieldAriaProps } from "@/components/ui/field";
import { startCheckout } from "@/lib/orders/checkout-actions";
import { priceOrder } from "@/lib/orders/pricing";
import { checkoutSchema, hasContact, type CheckoutInput } from "@/lib/validation/checkout";
import { formatPrice } from "@/lib/utils";
import type { TicketTypeRow } from "@/types/database";

import { QuantityPicker } from "./quantity-picker";
import { OrderSummary } from "./order-summary";

/* Formulaire de commande : quantités + coordonnées + récapitulatif temps réel. */

export function CheckoutForm({
  eventId,
  ticketTypes,
  preselectedId,
}: {
  eventId: string;
  ticketTypes: TicketTypeRow[];
  preselectedId?: string;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(ticketTypes.map((t) => [t.id, t.id === preselectedId ? 1 : 0])),
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      eventId, items: [], buyerName: "", buyerEmail: "", buyerPhone: "", promoCode: "",
    },
  });

  const selectedLines = useMemo(
    () =>
      ticketTypes
        .map((type) => ({ ticketType: type, quantity: quantities[type.id] ?? 0 }))
        .filter((line) => line.quantity > 0),
    [ticketTypes, quantities],
  );

  const pricing = useMemo(() => priceOrder(selectedLines), [selectedLines]);

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    const items = selectedLines.map((line) => ({
      ticketTypeId: line.ticketType.id, quantity: line.quantity,
    }));
    if (items.length === 0) {
      setServerError("Choisis au moins un billet.");
      return;
    }
    if (!hasContact(values)) {
      setServerError("Indique au moins un email ou un numéro pour recevoir tes billets.");
      return;
    }
    startTransition(async () => {
      const result = await startCheckout({ ...values, eventId, items });
      if (!result.ok || !result.paymentUrl) {
        setServerError(result.error ?? "Commande impossible.");
        return;
      }
      router.push(result.paymentUrl);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="flex min-w-0 flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Tes billets</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {ticketTypes.map((type) => (
              <QuantityPicker
                key={type.id}
                ticketType={type}
                quantity={quantities[type.id] ?? 0}
                onChange={(value) => setQuantities((prev) => ({ ...prev, [type.id]: value }))}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Tes coordonnées</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field label="Nom complet" htmlFor="buyerName" required error={errors.buyerName?.message}>
              <Input
                id="buyerName"
                autoComplete="name"
                placeholder="Koffi Atta"
                invalid={Boolean(errors.buyerName)}
                {...fieldAriaProps("buyerName", { error: errors.buyerName?.message })}
                {...register("buyerName")}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" htmlFor="buyerEmail" hint="Pour recevoir tes billets" error={errors.buyerEmail?.message}>
                <Input
                  id="buyerEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="koffi@example.ci"
                  invalid={Boolean(errors.buyerEmail)}
                  {...fieldAriaProps("buyerEmail", { error: errors.buyerEmail?.message })}
                  {...register("buyerEmail")}
                />
              </Field>
              <Field label="Téléphone" htmlFor="buyerPhone" hint="Mobile money" error={errors.buyerPhone?.message}>
                <Input
                  id="buyerPhone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+225 07 00 00 00"
                  invalid={Boolean(errors.buyerPhone)}
                  {...fieldAriaProps("buyerPhone", { error: errors.buyerPhone?.message })}
                  {...register("buyerPhone")}
                />
              </Field>
            </div>
            <Field label="Code promo (optionnel)" htmlFor="promoCode" error={errors.promoCode?.message}>
              <Input
                id="promoCode"
                placeholder="ABIDJAN10"
                className="uppercase"
                {...fieldAriaProps("promoCode", { error: errors.promoCode?.message })}
                {...register("promoCode")}
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <OrderSummary pricing={pricing} error={serverError} pending={pending} />
      </aside>
    </form>
  );
}
