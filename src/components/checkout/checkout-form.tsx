"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ArrowLeft, ArrowRight, Check, CreditCard, LockKeyhole } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, fieldAriaProps } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/states";
import { formatPrice } from "@/lib/utils";
import { startCheckout, validatePromoCode } from "@/lib/orders/checkout-actions";
import { priceOrder } from "@/lib/orders/pricing";
import {
  checkoutItemsFromQuantities,
  checkoutSchema,
  type CheckoutInput,
} from "@/lib/validation/checkout";
import type { TicketTypeRow } from "@/types/database";
import type { PaymentProviderName } from "@/lib/payments/types";

import { QuantityPicker } from "./quantity-picker";
import styles from "./checkout-form.module.css";

/* =============================================================================
   Tunnel de commande
   ---------------------------------------------------------------------------
   Trois étapes seulement : billets, coordonnées, paiement. Le récapitulatif et
   le bouton de paiement vivent sur la dernière étape, une seule fois.

   Sur mobile la barre d'action reste collée en bas de l'écran (au-dessus de la
   barre d'onglets quand la PWA est installée) : le total et l'action principale
   sont toujours atteignables sans faire défiler.

   À chaque changement d'étape, la vue revient en haut du formulaire et le focus
   suit, pour ne pas laisser l'utilisateur au milieu de la page.
   ========================================================================== */

const STEP_LABELS = ["Billets", "Coordonnées", "Paiement"] as const;
const LAST_STEP = STEP_LABELS.length - 1;

/* État de la vérification du code promo (action serveur en lecture seule ;
   la commande finale reste revalidée intégralement côté serveur). */
type PromoStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "applied"; code: string; discount: number; message: string }
  | { kind: "invalid"; message: string };

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
  const formRef = useRef<HTMLFormElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

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
    control,
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

  const [promoStatus, setPromoStatus] = useState<PromoStatus>({
    kind: "idle",
  });
  const pricing = useMemo(
    () =>
      priceOrder(selectedLines, {
        promoDiscount: promoStatus.kind === "applied" ? promoStatus.discount : 0,
      }),
    [selectedLines, promoStatus],
  );
  const buyerPhone = useWatch({ control, name: "buyerPhone" });
  const buyerName = useWatch({ control, name: "buyerName" });
  const buyerEmail = useWatch({ control, name: "buyerEmail" });
  const promoCode = useWatch({ control, name: "promoCode" });

  /* Vérifie le code promo à la saisie (requête après une courte pause).
     La remise affichée vient du serveur, jamais d'un calcul local. */
  useEffect(() => {
    const code = promoCode?.trim().toUpperCase() ?? "";
    if (code.length < 3) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setPromoStatus((current) =>
        current.kind === "applied" && current.code === code ? current : { kind: "checking" },
      );
      validatePromoCode({
        eventId,
        promoCode: code,
        items: checkoutItemsFromQuantities(ticketTypes, quantities),
      })
        .then((result) => {
          if (cancelled) return;
          if (result.ok && result.discount > 0) {
            setPromoStatus({
              kind: "applied",
              code,
              discount: result.discount,
              message: result.message ?? "Code appliqué.",
            });
          } else {
            setPromoStatus({ kind: "invalid", message: result.message ?? "Code non applicable." });
          }
        })
        .catch(() => {
          if (!cancelled) setPromoStatus({ kind: "idle" });
        });
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [promoCode, eventId, ticketTypes, quantities]);

  /* Change d'étape en ramenant la vue en haut du formulaire et en y portant le
     focus : sans ça, « Continuer » laissait l'utilisateur au bas de la page. */
  function goToStep(next: number) {
    setServerError(null);
    setStep(next);
    window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      formRef.current?.scrollIntoView({
        block: "start",
        behavior: reduceMotion ? "auto" : "smooth",
      });
      stepRef.current?.focus({ preventScroll: true });
    });
  }

  async function continueToNextStep() {
    setServerError(null);
    if (step === 0) {
      if (selectedLines.length === 0) {
        setServerError("Choisis au moins un billet pour continuer.");
        return;
      }
      goToStep(1);
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
      goToStep(2);
    }
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

  /* Porte le focus sur l'erreur dès son apparition (SC 3.3.1) : l'utilisateur
     sait immédiatement ce qui bloque, où qu'il soit dans le formulaire. */
  useEffect(() => {
    if (serverError) errorRef.current?.focus();
  }, [serverError]);

  const providerLabel =
    paymentProvider === "geniuspay"
      ? "GeniusPay"
      : paymentProvider === "cinetpay"
        ? "CinetPay"
        : "Mode de simulation";
  const providerHint =
    paymentProvider === "geniuspay" || paymentProvider === "cinetpay"
      ? "Wave, Orange Money ou une autre option proposée par le prestataire."
      : "Aucun montant réel ne sera débité.";

  const canPay = pricing.lines.length > 0 && !pending;

  return (
    <form
      ref={formRef}
      onSubmit={step === LAST_STEP ? onSubmit : (event) => event.preventDefault()}
      noValidate
      data-checkout-dirty={selectedLines.length > 0 ? "true" : undefined}
      className={`mx-auto w-full max-w-3xl ${inDialog ? "checkout-form-dialog" : ""}`}
    >
      <nav
        aria-label="Étapes de la commande"
        className="border-border bg-surface rounded-xl border px-3 py-3 sm:px-4"
      >
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-fg-muted text-sm">
            Étape <span className="text-fg font-semibold tabular-nums">{step + 1}</span> sur{" "}
            <span className="tabular-nums">{STEP_LABELS.length}</span>
            <span className={styles.currentLabel}> · {STEP_LABELS[step]}</span>
          </p>
          <p aria-live="polite" className="text-fg-muted text-sm tabular-nums">
            {pricing.ticketCount > 0
              ? `${pricing.ticketCount} billet${pricing.ticketCount > 1 ? "s" : ""} · ${formatPrice(pricing.total)}`
              : "Aucun billet sélectionné"}
          </p>
        </div>

        <ol className={styles.stepper}>
          {STEP_LABELS.map((label, index) => (
            <li key={label} className="min-w-0 flex-1">
              <button
                type="button"
                disabled={index > step || pending}
                onClick={() => goToStep(index)}
                aria-current={step === index ? "step" : undefined}
                className={`${styles.step} ${index < step ? styles.stepDone : ""}`}
              >
                <span className={styles.stepNumber} aria-hidden="true">
                  {index < step ? <Check className="size-3.5" /> : index + 1}
                </span>
                <span className={styles.stepLabel}>{label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div
        ref={stepRef}
        data-checkout-step={step}
        tabIndex={-1}
        role="group"
        aria-label={`Étape ${step + 1} : ${STEP_LABELS[step]}`}
        className="flex flex-col gap-4 outline-none"
      >
        {serverError ? (
          <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            aria-live="assertive"
            className="outline-none"
          >
            <Alert
              tone="danger"
              title="Le paiement n’a pas démarré"
              className={inDialog ? "p-3 text-xs" : undefined}
            >
              {serverError}
            </Alert>
          </div>
        ) : null}

        {step === 0 ? (
          <Card className="overflow-hidden rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle>Choisis tes billets</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {ticketTypes.map((type) => (
                <QuantityPicker
                  key={type.id}
                  ticketType={type}
                  quantity={quantities[type.id] ?? 0}
                  compact={inDialog}
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
        ) : null}

        {step === 1 ? (
          <Card className="overflow-hidden rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle>Vérifie tes coordonnées</CardTitle>
              {inDialog ? (
                <p className="text-fg-muted text-sm">
                  Modifiables avant le paiement. Ajoute un code promo si tu en as un.
                </p>
              ) : null}
              {!inDialog ? (
                <p className="text-fg-muted text-sm">
                  Reprises depuis ton compte, modifiables avant le paiement.
                </p>
              ) : null}
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
              <Field
                label="Email"
                htmlFor="buyerEmail"
                hint="Facultatif — tes billets restent dans ton compte"
                error={errors.buyerEmail?.message}
              >
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
              <Field
                label="Téléphone"
                htmlFor="buyerPhone"
                required
                hint={
                  inDialog
                    ? undefined
                    : initialBuyer.phone
                      ? "Prérempli depuis ton profil"
                      : "Avec l'indicatif du pays"
                }
                description={
                  inDialog
                    ? undefined
                    : "Transmis au prestataire pour préparer le paiement ; le débit est validé sur sa page sécurisée."
                }
                error={errors.buyerPhone?.message}
              >
                <Input
                  id="buyerPhone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+225 07 00 00 00"
                  required
                  aria-required="true"
                  invalid={Boolean(errors.buyerPhone)}
                  {...fieldAriaProps("buyerPhone", {
                    error: errors.buyerPhone?.message,
                    description: inDialog
                      ? undefined
                      : "Transmis au prestataire pour préparer le paiement ; le débit est validé sur sa page sécurisée.",
                  })}
                  {...register("buyerPhone")}
                />
              </Field>

              {inDialog ? (
                <div className="border-border border-t pt-3">
                  <Field
                    label="Code promo"
                    htmlFor="promoCode"
                    hint="Facultatif"
                    error={promoStatus.kind === "invalid" ? promoStatus.message : errors.promoCode?.message}
                  >
                    <Input
                      id="promoCode"
                      placeholder="ABIDJAN10"
                      className="uppercase"
                      invalid={promoStatus.kind === "invalid"}
                      {...fieldAriaProps("promoCode", {
                        error: promoStatus.kind === "invalid" ? promoStatus.message : undefined,
                      })}
                      {...register("promoCode", {
                        onChange: (event) => {
                          if (!event.target.value.trim()) setPromoStatus({ kind: "idle" });
                        },
                      })}
                    />
                  </Field>
                  {promoStatus.kind === "checking" ? (
                    <p className="text-fg-muted text-xs" role="status">
                      Vérification du code…
                    </p>
                  ) : null}
                  {promoStatus.kind === "applied" ? (
                    <p className="text-success flex items-center gap-1.5 text-xs font-medium" role="status">
                      <Check className="size-3.5 shrink-0" aria-hidden="true" />
                      {promoStatus.message}
                    </p>
                  ) : null}
                  {promoStatus.kind === "idle" && promoCode?.trim() ? (
                    <p className="text-fg-subtle text-xs">
                      Le code sera revérifié au moment du paiement.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {step === LAST_STEP ? (
          <div className="flex flex-col gap-4">
            <Card className="overflow-hidden rounded-xl">
              {!inDialog ? (
                <CardHeader className="pb-3">
                  <CardTitle>Ta commande</CardTitle>
                </CardHeader>
              ) : null}
              <CardContent className="flex flex-col gap-4">
                {/* En modal : la liste détaillée est déjà résumée dans la barre
                    d'action (nombre + total + lignes) ; on ne garde que le total
                    pour que l'étape tienne sans défilement. */}
                {!inDialog ? (
                  <ul className="divide-border divide-y">
                    {pricing.lines.map((line) => (
                      <li key={line.ticketTypeId} className="flex justify-between gap-3 py-2 text-sm">
                        <span className="min-w-0">
                          {line.quantity} × {line.name}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums">
                          {formatPrice(line.lineTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {pricing.discount > 0 ? (
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-success flex items-center gap-1.5 font-medium">
                      <Check className="size-3.5" aria-hidden="true" />
                      Remise {promoStatus.kind === "applied" ? promoStatus.code : ""}
                    </span>
                    <span className="text-success font-semibold tabular-nums">
                      −{formatPrice(pricing.discount)}
                    </span>
                  </div>
                ) : null}

                <div
                  className={`bg-bg-muted flex items-baseline justify-between gap-3 rounded-lg px-3 ${inDialog ? "py-2" : "py-3"}`}
                >
                  <span className="text-sm font-semibold">Total à payer</span>
                  <span
                    className={`font-display font-semibold tabular-nums ${inDialog ? "text-lg" : "text-xl"}`}
                  >
                    {formatPrice(pricing.total)}
                  </span>
                </div>

                <div
                  className={`border-border flex flex-col border-t pt-3 ${inDialog ? "gap-0.5 text-xs" : "gap-1 text-sm"}`}
                >
                  <p className="font-semibold">{buyerName}</p>
                  <p className="text-fg-muted break-words">
                    {buyerEmail || "Aucun email renseigné"} · {buyerPhone}
                  </p>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className={`text-primary mt-1 self-start font-semibold underline underline-offset-4 ${inDialog ? "min-h-9 text-xs" : "min-h-11 text-sm"}`}
                  >
                    Modifier mes coordonnées
                  </button>
                </div>

                {/* Modal : le prestataire tient sur une ligne, pas de carte
                    dédiée — l'étape doit rester visible sans défilement. */}
                {inDialog ? (
                  <p className="text-fg-muted flex items-center gap-2 text-xs">
                    <CreditCard className="size-3.5 shrink-0" aria-hidden="true" />
                    Paiement sécurisé via {providerLabel}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            {!inDialog ? (
            <Card className="overflow-hidden rounded-xl">
              <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="bg-primary-subtle text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                    <CreditCard className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{providerLabel}</p>
                    <p className="text-fg-muted text-sm">{providerHint}</p>
                  </div>
                </div>

                {!inDialog ? (
                  <Field
                    label="Code promo"
                    htmlFor="promoCode"
                    hint="Facultatif"
                    error={promoStatus.kind === "invalid" ? promoStatus.message : errors.promoCode?.message}
                  >
                    <Input
                      id="promoCode"
                      placeholder="ABIDJAN10"
                      className="uppercase"
                      invalid={promoStatus.kind === "invalid"}
                      {...fieldAriaProps("promoCode", {
                        error: promoStatus.kind === "invalid" ? promoStatus.message : undefined,
                      })}
                      {...register("promoCode", {
                        onChange: (event) => {
                          // Saisie vidée : on repart d'un état neutre sans effet de bord.
                          if (!event.target.value.trim()) setPromoStatus({ kind: "idle" });
                        },
                      })}
                    />
                  </Field>
                ) : null}

                {promoStatus.kind === "checking" ? (
                  <p className="text-fg-muted text-xs" role="status">
                    Vérification du code…
                  </p>
                ) : null}
                {promoStatus.kind === "applied" ? (
                  <p
                    className="text-success flex items-center gap-1.5 text-xs font-medium"
                    role="status"
                  >
                    <Check className="size-3.5 shrink-0" aria-hidden="true" />
                    {promoStatus.message}
                  </p>
                ) : null}
                {promoStatus.kind === "idle" && promoCode?.trim() ? (
                  <p className="text-fg-subtle text-xs">
                    Le code sera revérifié au moment du paiement.
                  </p>
                ) : null}

                <p
                  className={`text-fg-subtle flex items-start gap-2 ${inDialog ? "text-[0.6875rem]" : "text-xs"}`}
                >
                  <LockKeyhole className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  Le paiement est traité sur la page sécurisée du prestataire. Event ne conserve ni
                  code Mobile Money ni donnée de carte.
                </p>
              </CardContent>
            </Card>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        className={`${styles.bar} checkout-action-bar ${inDialog ? styles.barStatic : ""}`}
        data-checkout-bar=""
      >
        {/* Modal + dernière étape : le total est déjà dans la carte « Ta commande »,
            la barre ne garde que les actions pour libérer de la hauteur. */}
        {!inDialog || step < LAST_STEP ? (
          <div className={styles.barMeta}>
            <span className={styles.barCount}>
              {pricing.ticketCount > 0
                ? `${pricing.ticketCount} billet${pricing.ticketCount > 1 ? "s" : ""}`
                : "Aucun billet"}
            </span>
            <span className={styles.barTotal}>{formatPrice(pricing.total)}</span>
            {selectedLines.length > 0 ? (
              <span className={styles.barLines}>
                {selectedLines
                  .slice(0, 2)
                  .map((line) => `${line.quantity} × ${line.ticketType.name}`)
                  .join(" · ")}
                {selectedLines.length > 2 ? ` +${selectedLines.length - 2}` : ""}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className={styles.barActions}>
          {step > 0 ? (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => goToStep(step - 1)}
            >
              <ArrowLeft className="mr-1.5 size-4" aria-hidden="true" />
              <span className={step === 0 ? "" : "hidden sm:inline"}>Retour</span>
            </Button>
          ) : null}

          {step < LAST_STEP ? (
            <Button type="button" disabled={pending} onClick={() => void continueToNextStep()}>
              Continuer
              <ArrowRight className="ml-1.5 size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              type="submit"
              loading={pending}
              loadingLabel="Création de la commande…"
              disabled={!canPay}
            >
              {pricing.total === 0 ? "Obtenir mes billets" : `Payer ${formatPrice(pricing.total)}`}
            </Button>
          )}
        </div>
      </div>

      {step === LAST_STEP && paymentProvider !== "mock" ? (
        <p className="text-fg-muted mt-2 flex items-center justify-center gap-1.5 text-xs">
          <LockKeyhole className="size-3.5 shrink-0" aria-hidden="true" />
          Tu vas être redirigé vers {providerLabel} pour régler en toute sécurité.
        </p>
      ) : null}
    </form>
  );
}
