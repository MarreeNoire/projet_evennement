"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  LoaderCircle,
  LockKeyhole,
  Smartphone,
  Ticket,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input, fieldAriaProps } from "@/components/ui/field";
import { Alert } from "@/components/ui/states";
import { startCheckout } from "@/lib/orders/checkout-actions";
import { clearPendingPayment, savePendingPayment } from "@/lib/orders/pending-payment";
import { priceOrder } from "@/lib/orders/pricing";
import { haptic } from "@/lib/ui/haptics";
import { formatPrice } from "@/lib/utils";
import {
  checkoutItemsFromQuantities,
  checkoutSchema,
  type CheckoutInput,
} from "@/lib/validation/checkout";
import type { PaymentProviderName } from "@/lib/payments/types";
import type { TicketTypeRow } from "@/types/database";

import { PendingPaymentBanner } from "./pending-payment-banner";
import { QuantityPicker } from "./quantity-picker";
import styles from "./checkout-form.module.css";

/* =============================================================================
   Tunnel de commande — trois étapes : billets, coordonnées, paiement
   ---------------------------------------------------------------------------
   Principes appliqués (mobile d'abord, PWA comprise) :
   - Une seule action principale par écran, toujours à portée de pouce : la
     barre d'action reste en bas, au-dessus de la zone sûre des encoches.
   - Le total n'est répété qu'une fois par étape (barre), plus le récapitulatif
     final : pas de triple affichage du même montant.
   - On explique ce qui va se passer avant de payer (confirmation sur le
     téléphone), pour ne pas laisser croire à un blocage.
   - Après « Payer », un écran de redirection explicite évite l'écran figé,
     avec une issue de secours si le navigateur bloque la redirection.
   - La commande lancée est mémorisée : si l'utilisateur revient par une autre
     fenêtre (PWA), on lui propose de reprendre au bon endroit.
   - Changement d'étape : retour en haut + focus déplacé + annonce vocale.
   ========================================================================== */

const STEP_LABELS = ["Billets", "Coordonnées", "Email", "Paiement"] as const;
const LAST_STEP = STEP_LABELS.length - 1;

type Notice = { kind: "validation" | "payment"; message: string };

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
  const [notice, setNotice] = useState<Notice | null>(null);
  const [step, setStep] = useState(0);
  const [promoOpen, setPromoOpen] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [redirectSlow, setRedirectSlow] = useState(false);
  const [checkoutAttempt, setCheckoutAttempt] = useState<{
    fingerprint: string;
    key: string;
  } | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const redirectTimer = useRef<number | undefined>(undefined);

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

  const pricing = useMemo(() => priceOrder(selectedLines), [selectedLines]);
  const buyerPhone = useWatch({ control, name: "buyerPhone" });
  const buyerName = useWatch({ control, name: "buyerName" });
  const buyerEmail = useWatch({ control, name: "buyerEmail" });
  const promoCode = useWatch({ control, name: "promoCode" });

  const busy = pending || redirectUrl !== null;
  const countLabel =
    pricing.ticketCount > 0
      ? `${pricing.ticketCount} billet${pricing.ticketCount > 1 ? "s" : ""}`
      : "Aucun billet";

  /* Redirection : après 6 s sans changement de page, on propose un lien direct. */
  useEffect(() => {
    if (!redirectUrl) {
      setRedirectSlow(false);
      return;
    }
    const id = window.setTimeout(() => setRedirectSlow(true), 6000);
    return () => window.clearTimeout(id);
  }, [redirectUrl]);

  /* Retour par le bouton « précédent » (cache de navigation) : on réarme l'écran. */
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setRedirectUrl(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.clearTimeout(redirectTimer.current);
    };
  }, []);

  /* Change d'étape : revient en haut du formulaire et y porte le focus. */
  function goToStep(next: number) {
    setNotice(null);
    setStep(next);
    haptic("light");
    window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const behavior = reduceMotion ? "auto" : "smooth";

      if (inDialog) {
        scrollRef.current?.scrollTo({ top: 0, behavior });
      } else {
        const top = formRef.current?.getBoundingClientRect().top ?? 0;
        if (top < 0) formRef.current?.scrollIntoView({ block: "start", behavior });
      }
      stepRef.current?.focus({ preventScroll: true });
    });
  }

  async function continueToNextStep() {
    setNotice(null);

    if (step === 0) {
      if (selectedLines.length === 0) {
        setNotice({ kind: "validation", message: "Choisis au moins un billet pour continuer." });
        return;
      }
      goToStep(1);
      return;
    }

    if (step === 1) {
      const valid = await trigger(["buyerName", "buyerPhone"]);
      if (!valid) {
        if (errors.buyerName) setFocus("buyerName");
        else if (errors.buyerPhone) setFocus("buyerPhone");
        return;
      }
      goToStep(2);
      return;
    }

    if (step === 2) {
      const valid = await trigger("buyerEmail");
      if (!valid) {
        setFocus("buyerEmail");
        return;
      }
      goToStep(3);
    }
  }

  const onSubmit = handleSubmit(
    async (values) => {
      setNotice(null);
      const items = values.items;
      if (items.length === 0) {
        setNotice({ kind: "validation", message: "Choisis au moins un billet." });
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
          haptic("medium");
          setNotice({ kind: "payment", message: result.error ?? "Commande impossible. Réessaie." });
          return;
        }

        if (result.completed) {
          setCheckoutAttempt(null);
          window.sessionStorage.removeItem(`rassemble_checkout_${eventId}`);
          clearPendingPayment();
          haptic("success");
        } else if (result.orderId) {
          savePendingPayment({
            orderId: result.orderId,
            reference: result.orderReference ?? "",
            eventId,
            at: Date.now(),
          });
        }

        if (result.paymentUrl.startsWith("/")) {
          router.push(result.paymentUrl);
          return;
        }

        /* Page du prestataire : on affiche d'abord l'écran de redirection, puis on part. */
        setRedirectUrl(result.paymentUrl);
        const target = result.paymentUrl;
        redirectTimer.current = window.setTimeout(() => window.location.assign(target), 450);
      } catch {
        setNotice({
          kind: "payment",
          message: "La demande a échoué. Vérifie ta connexion puis réessaie.",
        });
      }
    },
    (invalid) => {
      const message =
        invalid.items?.message ??
        invalid.buyerName?.message ??
        invalid.buyerPhone?.message ??
        invalid.buyerEmail?.message ??
        "Vérifie les informations saisies avant de payer.";
      setNotice({ kind: "validation", message });

      if (invalid.buyerName) setFocus("buyerName");
      else if (invalid.buyerPhone) setFocus("buyerPhone");
      else if (invalid.buyerEmail) setFocus("buyerEmail");
    },
  );

  const providerLabel =
    paymentProvider === "geniuspay"
      ? "GeniusPay"
      : paymentProvider === "cinetpay"
        ? "CinetPay"
        : "Mode de simulation";
  const isReal = paymentProvider === "geniuspay" || paymentProvider === "cinetpay";
  const free = pricing.total === 0;

  const padX = inDialog ? styles.padX : "";

  return (
    <form
      ref={formRef}
      onSubmit={step === LAST_STEP ? onSubmit : (event) => event.preventDefault()}
      noValidate
      aria-busy={busy || undefined}
      className={`${styles.root} ${inDialog ? styles.rootDialog : ""}`}
    >
      {/* Progression : étape, nom de l'étape, segments cliquables pour revenir */}
      <nav aria-label="Étapes de la commande" className={`${styles.progress} ${padX}`}>
        <div className={styles.progressTop}>
          <p className={styles.progressStep}>
            Étape <span className="tabular-nums">{step + 1}</span> sur {STEP_LABELS.length}
          </p>
          <p className={styles.progressName}>{STEP_LABELS[step]}</p>
        </div>

        <ol className={styles.segments}>
          {STEP_LABELS.map((label, index) => {
            const reachable = index < step && !busy;
            return (
              <li key={label}>
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => goToStep(index)}
                  aria-current={step === index ? "step" : undefined}
                  aria-label={
                    index < step
                      ? `Revenir à l’étape ${index + 1} : ${label}`
                      : `Étape ${index + 1} : ${label}`
                  }
                  className={`${styles.segment} ${index < step ? styles.segmentDone : ""}`}
                  data-current={step === index}
                >
                  <span className={styles.segmentBar} aria-hidden="true" />
                  <span className={styles.segmentLabel}>
                    {index < step ? <Check aria-hidden="true" /> : null}
                    {label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <p className="sr-only" aria-live="polite">
        Étape {step + 1} sur {STEP_LABELS.length} : {STEP_LABELS[step]}
      </p>

      <div
        ref={scrollRef}
        className={`${styles.scroll} ${inDialog ? styles.scrollDialog : ""}`}
      >
        <PendingPaymentBanner eventId={eventId} />

        <div
          ref={stepRef}
          data-checkout-step={step}
          tabIndex={-1}
          className={`${styles.content} ${padX}`}
        >
          {/* --------------------------- 1. Billets --------------------------- */}
          {step === 0 ? (
            <section className={styles.card} aria-labelledby="step-tickets">
              <h2 id="step-tickets" className={styles.cardTitle}>
                Choisis tes billets
              </h2>
              <p className={styles.cardHint}>Tu pourras modifier ta sélection avant de payer.</p>
              <div className={styles.stack}>
                {ticketTypes.map((type) => (
                  <QuantityPicker
                    key={type.id}
                    ticketType={type}
                    quantity={quantities[type.id] ?? 0}
                    compact={inDialog}
                    disabled={busy}
                    onChange={(value) => {
                      const next = { ...quantities, [type.id]: value };
                      setQuantities(next);
                      setNotice(null);
                      haptic("light");
                      setValue("items", checkoutItemsFromQuantities(ticketTypes, next), {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* ------------------------- 2. Coordonnées ------------------------- */}
          {step === 1 ? (
            <section className={styles.card} aria-labelledby="step-contact">
              <h2 id="step-contact" className={styles.cardTitle}>
                Tes coordonnées
              </h2>
              <p className={styles.cardHint}>
                {initialBuyer.phone
                  ? "Reprises depuis ton compte : vérifie-les, tu peux les modifier."
                  : "Le téléphone sert à préparer ton paiement mobile money."}
              </p>

              <div className={styles.stack}>
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
                  label="Téléphone"
                  htmlFor="buyerPhone"
                  required
                  description="Numéro de ton compte mobile money, avec l’indicatif (+225)."
                  error={errors.buyerPhone?.message}
                >
                  <Input
                    id="buyerPhone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="+225 07 00 00 00 00"
                    required
                    aria-required="true"
                    invalid={Boolean(errors.buyerPhone)}
                    {...fieldAriaProps("buyerPhone", {
                      error: errors.buyerPhone?.message,
                      description: "Numéro de ton compte mobile money, avec l’indicatif (+225).",
                    })}
                    {...register("buyerPhone")}
                  />
                </Field>

              </div>
            </section>
          ) : null}

          {/* -------------------------- 3. Email facultatif ------------------- */}
          {step === 2 ? (
            <section className={styles.card} aria-labelledby="step-email">
              <h2 id="step-email" className={styles.cardTitle}>Recevoir mon billet par email</h2>
              <p className={styles.cardHint}>
                Facultatif. Ton billet reste aussi disponible dans Mes billets.
              </p>
              <div className={styles.stack}>
                <Field
                  label="Adresse email"
                  htmlFor="buyerEmail"
                  hint="Facultatif"
                  error={errors.buyerEmail?.message}
                >
                  <Input
                    id="buyerEmail"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="koffi@exemple.ci"
                    invalid={Boolean(errors.buyerEmail)}
                    {...fieldAriaProps("buyerEmail", { error: errors.buyerEmail?.message })}
                    {...register("buyerEmail")}
                  />
                </Field>
              </div>
            </section>
          ) : null}

          {/* --------------------------- 4. Paiement -------------------------- */}
          {step === LAST_STEP ? (
            <>
              <section className={styles.card} aria-labelledby="step-recap">
                <h2 id="step-recap" className={styles.cardTitle}>
                  Récapitulatif
                </h2>

                <ul className={styles.lines}>
                  {pricing.lines.map((line) => (
                    <li key={line.ticketTypeId} className={styles.line}>
                      <span className="min-w-0">
                        {line.quantity} × {line.name}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums">
                        {free ? "Gratuit" : formatPrice(line.lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className={styles.total}>
                  <span>Total à payer</span>
                  <strong className={styles.totalValue}>
                    {free ? "Gratuit" : formatPrice(pricing.total)}
                  </strong>
                </div>

                <div className={styles.buyer}>
                  <div className="min-w-0">
                    <p className="font-semibold">{buyerName}</p>
                    <p className="text-fg-muted break-words text-sm">
                      {buyerPhone}
                      {buyerEmail ? ` · ${buyerEmail}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    disabled={busy}
                    className={styles.link}
                  >
                    Modifier
                  </button>
                </div>
              </section>

              {!free ? (
                <section className={styles.card} aria-labelledby="step-how">
                  <h2 id="step-how" className={styles.cardTitle}>
                    Comment ça se passe
                  </h2>
                  <ol className={styles.flow}>
                    <li>
                      <span className={styles.flowIcon} aria-hidden="true">
                        <LockKeyhole />
                      </span>
                      <div>
                        <p className={styles.flowTitle}>Page de paiement sécurisée</p>
                        <p className={styles.flowText}>
                          {isReal
                            ? `Tu choisis Wave, Orange Money, MTN ou Moov sur la page de ${providerLabel}.`
                            : "Mode simulation : aucun montant réel ne sera débité."}
                        </p>
                      </div>
                    </li>
                    <li>
                      <span className={styles.flowIcon} aria-hidden="true">
                        <Smartphone />
                      </span>
                      <div>
                        <p className={styles.flowTitle}>Tu confirmes sur ton téléphone</p>
                        <p className={styles.flowText}>
                          Une notification ou un message USSD s’affiche : valide avec ton code
                          secret.
                        </p>
                      </div>
                    </li>
                    <li>
                      <span className={styles.flowIcon} aria-hidden="true">
                        <Ticket />
                      </span>
                      <div>
                        <p className={styles.flowTitle}>Ton billet arrive ici</p>
                        <p className={styles.flowText}>
                          Tu reviens automatiquement dans l’application, avec ton QR code et l’accès
                          au salon.
                        </p>
                      </div>
                    </li>
                  </ol>
                </section>
              ) : null}

              <section className={styles.card} aria-labelledby="step-extra">
                <h2 id="step-extra" className="sr-only">
                  Options
                </h2>

                {promoOpen || promoCode?.trim() ? (
                  <Field label="Code promo" htmlFor="promoCode" hint="Facultatif" error={errors.promoCode?.message}>
                    <Input
                      id="promoCode"
                      placeholder="ABIDJAN10"
                      autoCapitalize="characters"
                      autoComplete="off"
                      className="uppercase"
                      {...fieldAriaProps("promoCode", { error: errors.promoCode?.message })}
                      {...register("promoCode")}
                    />
                  </Field>
                ) : (
                  <button
                    type="button"
                    className={styles.promoToggle}
                    aria-expanded={false}
                    onClick={() => setPromoOpen(true)}
                  >
                    J’ai un code promo
                    <ChevronDown aria-hidden="true" />
                  </button>
                )}

                {promoCode?.trim() ? (
                  <p className={styles.fine}>
                    Le code est vérifié au moment du paiement : le montant débité peut être
                    inférieur au total affiché.
                  </p>
                ) : null}

                <p className={styles.secure}>
                  <LockKeyhole aria-hidden="true" />
                  Event ne conserve ni code Mobile Money ni donnée de carte : tout se passe chez le
                  prestataire.
                </p>
              </section>
            </>
          ) : null}
        </div>

        {notice ? (
          <div role="alert" aria-live="assertive" className={`${styles.notice} ${padX}`}>
            <Alert
              tone={notice.kind === "validation" ? "warning" : "danger"}
              title={
                notice.kind === "validation"
                  ? "Il manque quelque chose"
                  : "Le paiement n’a pas démarré"
              }
            >
              {notice.message}
            </Alert>
          </div>
        ) : null}
      </div>

      {/* Réserve la place de la barre fixe (page mobile) */}
      {!inDialog ? <div className={styles.barSpacer} aria-hidden="true" /> : null}

      <div className={`${styles.bar} ${inDialog ? styles.barDialog : styles.barPage}`}>
        <div className={styles.barInner}>
          {step > 0 ? (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              disabled={busy}
              onClick={() => goToStep(step - 1)}
              aria-label="Revenir à l’étape précédente"
            >
              <ArrowLeft aria-hidden="true" />
            </Button>
          ) : null}

          {step < LAST_STEP ? (
            <>
              <div className={styles.barMeta} aria-live="polite">
                <span className={styles.barCount}>{countLabel}</span>
                <span className={styles.barTotal}>
                  {pricing.ticketCount > 0 ? (free ? "Gratuit" : formatPrice(pricing.total)) : "—"}
                </span>
              </div>
              <Button
                type="button"
                size="lg"
                disabled={busy}
                onClick={() => void continueToNextStep()}
                className={styles.cta}
              >
                Continuer
                <ArrowRight aria-hidden="true" />
              </Button>
            </>
          ) : (
            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={pending}
              loadingLabel="Création de la commande…"
              disabled={busy || pricing.lines.length === 0}
              className={styles.ctaWide}
            >
              <LockKeyhole aria-hidden="true" />
              {free ? "Obtenir mes billets" : `Payer ${formatPrice(pricing.total)}`}
            </Button>
          )}
        </div>
      </div>

      {/* Écran de redirection vers le prestataire */}
      {redirectUrl ? (
        <div
          className={`${styles.overlay} ${inDialog ? styles.overlayDialog : ""}`}
          role="status"
          aria-live="polite"
        >
          <div className={styles.overlayCard}>
            <span className={styles.spinner} aria-hidden="true">
              <LoaderCircle />
            </span>
            <h2 className={styles.overlayTitle}>Ouverture du paiement sécurisé…</h2>
            <p className={styles.overlayText}>
              Tu vas confirmer avec Wave, Orange Money, MTN ou Moov. Ne ferme pas cette page : tu
              reviens ici automatiquement après le paiement.
            </p>

            {redirectSlow ? (
              <div className={styles.overlayRescue}>
                <p className={styles.overlayText}>La page ne s’ouvre pas ?</p>
                <a href={redirectUrl} className={styles.rescueLink}>
                  Ouvrir la page de paiement
                </a>
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => {
                    window.clearTimeout(redirectTimer.current);
                    setRedirectUrl(null);
                  }}
                >
                  Annuler et revenir à la commande
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </form>
  );
}
