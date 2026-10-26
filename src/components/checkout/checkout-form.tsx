"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, Check, CreditCard, LockKeyhole } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, fieldAriaProps } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/states";
import { formatPrice } from "@/lib/utils";
import { startCheckout } from "@/lib/orders/checkout-actions";
import { priceOrder } from "@/lib/orders/pricing";
import {
  checkoutItemsFromQuantities,
  checkoutSchema,
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
  initialBuyer,
  inDialog = false,
}: {
  eventId: string;
  ticketTypes: TicketTypeRow[];
  preselectedId?: string;
  paymentProvider: PaymentProviderName;
  initialBuyer: { name: string; email: string; phone: string };
  inDialog?: boolean;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [checkoutAttempt, setCheckoutAttempt] = useState<{
    fingerprint: string;
    key: string;
  } | null>(null);
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
    trigger,
    watch,
    formState: { errors, isSubmitting: pending },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      eventId,
      items: checkoutItemsFromQuantities(ticketTypes, initialQuantities),
      buyerName: initialBuyer.name,
      buyerEmail: initialBuyer.email,
      buyerPhone: initialBuyer.phone,
      promoCode: "",
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
  const buyerPhone = watch("buyerPhone");

  async function continueToNextStep() {
    setServerError(null);
    if (step === 0) {
      if (selectedLines.length === 0) {
        setServerError("Choisis au moins un billet pour continuer.");
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      const valid = await trigger(["buyerName", "buyerEmail", "buyerPhone"]);
      if (!valid) {
        if (errors.buyerName) setFocus("buyerName");
        else if (errors.buyerEmail) setFocus("buyerEmail");
        else if (errors.buyerPhone) setFocus("buyerPhone");
        return;
      }
    }
    setStep((current) => Math.min(current + 1, 3));
  }

  const onSubmit = handleSubmit(
    async (values) => {
      setServerError(null);
      const items = values.items;
      if (items.length === 0) {
        setServerError("Choisis au moins un billet.");
        return;
      }
      try {
        const fingerprint = JSON.stringify({ ...values, eventId, items });
        let attempt = checkoutAttempt;
        if (!attempt) {
          try {
            const saved = window.sessionStorage.getItem(`rassemble_checkout_${eventId}`);
            if (saved) attempt = JSON.parse(saved) as { fingerprint: string; key: string };
          } catch {
            // Le formulaire reste utilisable si le navigateur bloque le stockage local.
          }
        }
        if (attempt?.fingerprint !== fingerprint) {
          attempt = { fingerprint, key: crypto.randomUUID() };
          try {
            window.sessionStorage.setItem(`rassemble_checkout_${eventId}`, JSON.stringify(attempt));
          } catch {
            // La clé en mémoire protège au moins les répétitions dans cette page.
          }
        }
        setCheckoutAttempt(attempt);
        const result = await startCheckout({ ...values, eventId, items }, attempt.key);
        if (!result.ok || !result.paymentUrl) {
          if (result.retryWithNewAttempt) {
            setCheckoutAttempt(null);
            window.sessionStorage.removeItem(`rassemble_checkout_${eventId}`);
          }
          setServerError(result.error ?? "Commande impossible. Réessaie.");
          return;
        }
        if (result.paymentUrl.startsWith("/")) {
          if (result.completed) {
            setCheckoutAttempt(null);
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

  const stepLabels = ["Billets", "Coordonnées", "Paiement", "Confirmation"];

  return (
    <form onSubmit={step === 3 ? onSubmit : (event) => event.preventDefault()} noValidate className={`mx-auto w-full max-w-3xl ${inDialog ? "checkout-form-dialog" : "space-y-5 sm:space-y-6"}`}>
      <nav aria-label="Étapes de la commande" className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold">Étape {step + 1} sur {stepLabels.length}</span>
          <span className="text-fg-muted">{stepLabels[step]}</span>
        </div>
        <div role="progressbar" aria-label="Avancement de la commande" aria-valuemin={1} aria-valuemax={stepLabels.length} aria-valuenow={step + 1} aria-valuetext={`Étape ${step + 1} sur ${stepLabels.length} : ${stepLabels[step]}`} className="h-1.5 overflow-hidden rounded-full bg-bg-muted">
          <div className="h-full rounded-full bg-primary transition-[width] duration-300 " style={{ width: `${((step + 1) / stepLabels.length) * 100}%` }} />
        </div>
        <ol className="mt-4 hidden grid-cols-4 gap-2 sm:grid">
          {stepLabels.map((label, index) => (
            <li key={label}>
              <button type="button" disabled={index > step || pending} onClick={() => setStep(index)} aria-current={step === index ? "step" : undefined} className={`flex min-h-12 w-full items-center gap-2 rounded-md border px-2 text-left text-xs font-semibold sm:px-3 sm:text-sm ${step === index ? "border-primary bg-primary-subtle text-primary" : index < step ? "border-border bg-surface text-fg" : "border-border bg-bg text-fg-subtle"}`}>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px]">{index < step ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}</span>
                <span className="truncate">{label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {serverError && step !== 3 ? <Alert tone="danger" title="Vérifie cette étape">{serverError}</Alert> : null}

      {step === 0 ? (
        <Card data-checkout-step={step} className="overflow-hidden rounded-xl">
          <CardHeader className="pb-4"><CardTitle>Choisis tes billets</CardTitle>{!inDialog ? <p className="text-sm text-fg-muted">Ajuste les quantités avant de continuer.</p> : null}</CardHeader>
          <CardContent className="flex flex-col gap-3">
            {ticketTypes.map((type) => <QuantityPicker key={type.id} ticketType={type} quantity={quantities[type.id] ?? 0} compact={inDialog} disabled={pending} onChange={(value) => {
              const next = { ...quantities, [type.id]: value };
              setQuantities(next);
              setServerError(null);
              setValue("items", checkoutItemsFromQuantities(ticketTypes, next), { shouldDirty: true, shouldValidate: true });
            }} />)}
            {selectedLines.length ? <p className="border-t border-border pt-3 text-right text-sm font-semibold">{pricing.ticketCount} billet{pricing.ticketCount > 1 ? "s" : ""} · {formatPrice(pricing.total)}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card data-checkout-step={step} className="overflow-hidden rounded-xl">
          <CardHeader className="pb-4"><CardTitle>Vérifie tes coordonnées</CardTitle>{!inDialog ? <p className="text-sm text-fg-muted">Elles sont reprises depuis ton compte et restent modifiables.</p> : null}</CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field label="Nom complet" htmlFor="buyerName" required error={errors.buyerName?.message}>
              <Input id="buyerName" autoComplete="name" placeholder="Koffi Atta" required invalid={Boolean(errors.buyerName)} {...fieldAriaProps("buyerName", { error: errors.buyerName?.message })} {...register("buyerName")} />
            </Field>
            <Field label="Email" htmlFor="buyerEmail" hint="Facultatif" error={errors.buyerEmail?.message}>
              <Input id="buyerEmail" type="email" autoComplete="email" placeholder="koffi@example.ci" invalid={Boolean(errors.buyerEmail)} {...fieldAriaProps("buyerEmail", { error: errors.buyerEmail?.message })} {...register("buyerEmail")} />
            </Field>
            <Field label="Téléphone" htmlFor="buyerPhone" required hint={inDialog ? undefined : initialBuyer.phone ? "Prérempli depuis ton profil · modifiable" : "Avec l'indicatif du pays"} description={inDialog ? undefined : "Transmis au prestataire pour préparer le paiement ; le débit est validé sur sa page sécurisée."} error={errors.buyerPhone?.message}>
              <Input id="buyerPhone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+225 07 00 00 00" required aria-required="true" invalid={Boolean(errors.buyerPhone)} {...fieldAriaProps("buyerPhone", { error: errors.buyerPhone?.message, description: inDialog ? undefined : "Transmis au prestataire pour préparer le paiement ; le débit est validé sur sa page sécurisée." })} {...register("buyerPhone")} />
            </Field>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <div data-checkout-step={step} className="space-y-4">
          <Card className="overflow-hidden rounded-xl">
            <CardHeader><CardTitle>Prépare ton paiement</CardTitle>{!inDialog ? <p className="text-sm text-fg-muted">Le paiement s’ouvrira sur la page sécurisée du prestataire.</p> : null}</CardHeader>
            <CardContent className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary"><CreditCard className="size-5" aria-hidden="true" /></span>
              <div><p className="font-semibold">{paymentProvider === "geniuspay" ? "GeniusPay" : paymentProvider === "cinetpay" ? "CinetPay" : "Mode de simulation"}</p><p className="mt-1 text-sm text-fg-muted">{paymentProvider === "geniuspay" || paymentProvider === "cinetpay" ? "Wave, Orange Money ou une autre option disponible." : "Aucun montant réel ne sera débité."}</p></div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden rounded-xl">
            <CardHeader><CardTitle>Numéro de téléphone</CardTitle>{!inDialog ? <p className="text-sm text-fg-muted">Utilisé pour préparer la demande de paiement.</p> : null}</CardHeader>
            <CardContent><p className="text-lg font-semibold tabular-nums">{buyerPhone || "Non renseigné"}</p><button type="button" className="mt-2 min-h-10 text-sm font-semibold text-primary underline underline-offset-4" onClick={() => setStep(1)}>Modifier mes coordonnées</button></CardContent>
          </Card>
          <Field label="Code promo" htmlFor="promoCode" hint="Facultatif" error={errors.promoCode?.message}>
            <Input id="promoCode" placeholder="ABIDJAN10" className="uppercase" {...fieldAriaProps("promoCode", { error: errors.promoCode?.message })} {...register("promoCode")} />
          </Field>
        </div>
      ) : null}

      {step === 3 ? (
        <div data-checkout-step={step} className="space-y-4">
          <Card className="overflow-hidden rounded-xl">
            <CardHeader className="pb-2"><CardTitle>Vérifie ta commande</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <ul className="divide-y divide-border">{pricing.lines.map((line) => <li key={line.ticketTypeId} className="flex justify-between gap-3 py-2 text-sm"><span>{line.quantity} × {line.name}</span><span className="shrink-0 font-semibold tabular-nums">{formatPrice(line.lineTotal)}</span></li>)}</ul>
              <dl className="flex justify-between border-t border-border pt-2 text-base font-bold"><dt>Total à payer</dt><dd className="tabular-nums">{formatPrice(pricing.total)}</dd></dl>
              <div className="rounded-md bg-bg-muted p-2.5 text-sm"><p className="font-semibold">{watch("buyerName")}</p><p className="text-fg-muted">{watch("buyerEmail") || "Aucun email renseigné"} · {buyerPhone}</p></div>
            </CardContent>
          </Card>
          <OrderSummary pricing={pricing} pending={pending} error={serverError} paymentProvider={paymentProvider} compact={inDialog} />
          {!inDialog ? <p className="flex items-center justify-center gap-2 text-center text-xs text-fg-subtle"><LockKeyhole className="size-3.5" aria-hidden="true" /> Le paiement est traité sur la page sécurisée du prestataire.</p> : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <Button type="button" variant="secondary" disabled={step === 0 || pending} onClick={() => { setServerError(null); setStep((current) => Math.max(current - 1, 0)); }}>
          <ArrowLeft className="mr-2 size-4" aria-hidden="true" /> Retour
        </Button>
        {step < 3 ? <Button type="button" disabled={pending} onClick={() => void continueToNextStep()}>Continuer <ArrowRight className="ml-2 size-4" aria-hidden="true" /></Button> : null}
      </div>
    </form>
  );
}
