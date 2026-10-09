"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, fieldAriaProps } from "@/components/ui/field";
import { startCheckout } from "@/lib/orders/checkout-actions";
import { priceOrder } from "@/lib/orders/pricing";
import {
  checkoutItemsFromQuantities,
  checkoutSchema,
  hasContact,
  type CheckoutInput,
} from "@/lib/validation/checkout";
import type { TicketTypeRow } from "@/types/database";
import type { PaymentProviderName } from "@/lib/payments/types";

import { QuantityPicker } from "./quantity-picker";
import { OrderSummary } from "./order-summary";

/* Formulaire de commande : quantités + coordonnées + récapitulatif temps réel. */

export function CheckoutForm({
  eventId,
  ticketTypes,
  preselectedId,
  paymentProvider,
}: {
  eventId: string;
  ticketTypes: TicketTypeRow[];
  preselectedId?: string;
  paymentProvider: PaymentProviderName;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const checkoutAttempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const initialTicket =
    ticketTypes.find(
      (ticket) =>
        ticket.id === preselectedId &&
        ticket.is_active &&
        ticket.sold_count < ticket.quantity &&
        ticket.max_per_order > 0,
    ) ??
    ticketTypes.find(
      (ticket) =>
        ticket.is_active && ticket.sold_count < ticket.quantity && ticket.max_per_order > 0,
    );
  const initialQuantities = Object.fromEntries(
    ticketTypes.map((ticket) => [ticket.id, ticket.id === initialTicket?.id ? 1 : 0]),
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(initialQuantities);

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    control,
    formState: { errors, isSubmitting: pending },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      eventId,
      items: checkoutItemsFromQuantities(ticketTypes, initialQuantities),
      buyerName: "",
      buyerEmail: "",
      buyerPhone: "",
      promoCode: "",
    },
  });

  const buyerEmail = useWatch({ control, name: "buyerEmail" });
  const buyerPhone = useWatch({ control, name: "buyerPhone" });

  const selectedLines = useMemo(
    () =>
      ticketTypes
        .map((type) => ({ ticketType: type, quantity: quantities[type.id] ?? 0 }))
        .filter((line) => line.quantity > 0),
    [ticketTypes, quantities],
  );

  const pricing = useMemo(() => priceOrder(selectedLines), [selectedLines]);

  const onSubmit = handleSubmit(
    async (values) => {
      setServerError(null);
      const items = values.items;
      if (items.length === 0) {
        setServerError("Choisis au moins un billet.");
        return;
      }
      if (!hasContact(values)) {
        setServerError("Indique au moins un email ou un numéro pour recevoir tes billets.");
        return;
      }
      try {
        const fingerprint = JSON.stringify({ ...values, eventId, items });
        if (!checkoutAttempt.current) {
          try {
            const saved = window.sessionStorage.getItem(`rassemble_checkout_${eventId}`);
            if (saved) checkoutAttempt.current = JSON.parse(saved) as { fingerprint: string; key: string };
          } catch {
            // Le formulaire reste utilisable si le navigateur bloque le stockage local.
          }
        }
        if (checkoutAttempt.current?.fingerprint !== fingerprint) {
          checkoutAttempt.current = { fingerprint, key: crypto.randomUUID() };
          try {
            window.sessionStorage.setItem(`rassemble_checkout_${eventId}`, JSON.stringify(checkoutAttempt.current));
          } catch {
            // La clé en mémoire protège au moins les répétitions dans cette page.
          }
        }
        const result = await startCheckout(
          { ...values, eventId, items },
          checkoutAttempt.current.key,
        );
        if (!result.ok || !result.paymentUrl) {
          if (result.retryWithNewAttempt) {
            checkoutAttempt.current = null;
            window.sessionStorage.removeItem(`rassemble_checkout_${eventId}`);
          }
          setServerError(result.error ?? "Commande impossible. Réessaie.");
          return;
        }
        if (result.paymentUrl.startsWith("/")) {
          if (result.completed) {
            checkoutAttempt.current = null;
            window.sessionStorage.removeItem(`rassemble_checkout_${eventId}`);
          }
          router.push(result.paymentUrl);
        } else {
          window.location.assign(result.paymentUrl);
        }
      } catch {
        setServerError("La demande a échoué. Vérifie ta connexion puis réessaie.");
      }
    },
    (invalid) => {
      const message =
        invalid.items?.message ??
        invalid.buyerName?.message ??
        invalid.buyerEmail?.message ??
        invalid.buyerPhone?.message ??
        "Vérifie les informations saisies avant de payer.";
      setServerError(message);

      if (invalid.buyerName) setFocus("buyerName");
      else if (invalid.buyerEmail) setFocus("buyerEmail");
      else if (invalid.buyerPhone) setFocus("buyerPhone");
    },
  );

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
                disabled={pending}
                onChange={(value) => {
                  const next = { ...quantities, [type.id]: value };
                  setQuantities(next);
                  setServerError(null);
                  setValue("items", checkoutItemsFromQuantities(ticketTypes, next), {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Tes coordonnées</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field
              label="Nom complet"
              htmlFor="buyerName"
              required
              error={errors.buyerName?.message}
            >
              <Input
                id="buyerName"
                autoComplete="name"
                placeholder="Koffi Atta"
                required
                invalid={Boolean(errors.buyerName)}
                {...fieldAriaProps("buyerName", { error: errors.buyerName?.message })}
                {...register("buyerName")}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Email"
                htmlFor="buyerEmail"
                required={!buyerPhone?.trim()}
                hint={buyerPhone?.trim() ? "Facultatif" : "Requis si aucun téléphone"}
                error={errors.buyerEmail?.message}
              >
                <Input
                  id="buyerEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="koffi@example.ci"
                  required={!buyerPhone?.trim()}
                  aria-required={!buyerPhone?.trim()}
                  invalid={Boolean(errors.buyerEmail)}
                  {...fieldAriaProps("buyerEmail", { error: errors.buyerEmail?.message })}
                  {...register("buyerEmail")}
                />
              </Field>
              <Field
                label="Téléphone"
                htmlFor="buyerPhone"
                required={!buyerEmail?.trim()}
                hint={buyerEmail?.trim() ? "Facultatif" : "Requis si aucun email"}
                error={errors.buyerPhone?.message}
              >
                <Input
                  id="buyerPhone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+225 07 00 00 00"
                  required={!buyerEmail?.trim()}
                  aria-required={!buyerEmail?.trim()}
                  invalid={Boolean(errors.buyerPhone)}
                  {...fieldAriaProps("buyerPhone", { error: errors.buyerPhone?.message })}
                  {...register("buyerPhone")}
                />
              </Field>
            </div>
            <Field
              label="Code promo (optionnel)"
              htmlFor="promoCode"
              error={errors.promoCode?.message}
            >
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
        <OrderSummary
          pricing={pricing}
          pending={pending}
          error={serverError}
          paymentProvider={paymentProvider}
        />
      </aside>
    </form>
  );
}
