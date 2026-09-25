import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { APP_NAME, CURRENCY_LABEL, PLATFORM_COMMISSION_RATE, ROUTES } from "@/lib/constants";
import { getCurrentProfile } from "@/lib/supabase/server";
import { BecomeOrganizerForm } from "@/components/auth/become-organizer-form";

export const metadata: Metadata = { title: "Devenir organisateur | Rassemble" };

const BENEFITS = [
  {
    title: "Billetterie complète",
    description:
      "Plusieurs types de billets, quotas, dates de vente et codes promo, avec paiement mobile money et carte.",
  },
  {
    title: "Un salon pour ta communauté",
    description:
      "Chaque événement crée automatiquement son salon : discussion, photos, programme et annonces avec les participants.",
  },
  {
    title: "Check-in par QR code",
    description:
      "Scanne les billets à l'entrée avec validation en temps réel côté serveur : plus de doublons, plus de fraude.",
  },
  {
    title: "Statistiques de vente",
    description:
      "Suis les ventes, les entrées et le taux de remplissage depuis un tableau de bord dédié.",
  },
  {
    title: "Annonces et networking",
    description:
      "Communique directement avec tes participants et laisse-les se connecter entre eux avant, pendant et après.",
  },
  {
    title: "Paiements simples",
    description: `Commission unique de ${Math.round(PLATFORM_COMMISSION_RATE * 100)} % par billet vendu, sans frais caché.`,
  },
];

const PLANS = [
  {
    name: "Gratuit",
    price: "0",
    tagline: "Pour démarrer et tester la plateforme.",
    features: ["Création d'événement", "Billetterie basique", "Salon basique"],
    cta: "Créer mon compte",
    href: ROUTES.register,
    variant: "secondary" as const,
  },
  {
    name: "Pro",
    price: "Sur devis",
    tagline: "Pour les organisateurs réguliers.",
    features: [
      "Statistiques avancées",
      "Branding personnalisé",
      "Export des données",
      "Marketing et équipe",
    ],
    cta: "Créer mon compte",
    href: ROUTES.register,
    variant: "primary" as const,
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Sur devis",
    tagline: "Grandes entreprises, conférences, universités.",
    features: ["Accompagnement dédié", "Intégrations sur mesure", "Volumes importants"],
    cta: "Nous contacter",
    href: "/contact",
    variant: "secondary" as const,
  },
];

export default async function BecomeOrganizerPage() {
  const profile = await getCurrentProfile();
  const isOrganizer = profile?.roles.includes("organizer");

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="flex flex-col">
        {/* Hero */}
        <section className="border-b border-border bg-surface">
          <div className="container-page grid gap-8 py-14 md:py-20 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-16">
            <div className="flex flex-col gap-6">
              <p className="eyebrow">Pour les organisateurs</p>
              <h1 className="font-display text-4xl leading-[1.02] font-semibold md:text-6xl">
                Organise ton événement,{" "}
                <span className="font-normal text-primary italic">{APP_NAME}</span> s&apos;occupe du
                reste.
              </h1>
              <p className="text-base leading-relaxed text-fg-muted">
                Billetterie mobile money, check-in par QR code, salon communautaire et statistiques
                de vente : tout ce qu&apos;il faut pour vendre des billets et garder le lien avec
                tes participants, avant, pendant et après.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {profile ? (
                isOrganizer ? (
                  <div className="rounded-xl border border-success/30 bg-success-subtle/20 p-6 space-y-4 text-center">
                    <p className="font-bold text-lg text-fg">Vous êtes déjà organisateur !</p>
                    <p className="text-sm text-fg-muted">
                      Accédez directement à votre tableau de bord pour créer et gérer vos événements.
                    </p>
                    <ButtonLink href="/org" size="lg" className="w-full justify-center">
                      Accéder à mon espace organisateur
                    </ButtonLink>
                  </div>
                ) : (
                  <BecomeOrganizerForm user={{ displayName: profile.display_name }} />
                )
              ) : (
                <div className="rounded-xl border border-border bg-bg-subtle p-6 space-y-4">
                  <p className="font-bold text-lg text-fg">Prêt à vous lancer ?</p>
                  <p className="text-sm text-fg-muted">
                    Créez votre compte gratuit en moins d&apos;une minute pour activer votre espace organisateur.
                  </p>
                  <div className="flex flex-col gap-2">
                    <ButtonLink href={ROUTES.register} size="lg" fullWidth>
                      Créer mon compte
                    </ButtonLink>
                    <ButtonLink href={ROUTES.login} variant="secondary" size="lg" fullWidth>
                      Déjà inscrit ? Connexion
                    </ButtonLink>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Bénéfices */}
        <section className="container-page py-16 md:py-20" aria-labelledby="avantages">
          <div className="grid gap-10 lg:grid-cols-[1fr_2.2fr] lg:gap-16">
            <div>
              <p className="eyebrow">Ce qui est inclus</p>
              <h2
                id="avantages"
                className="mt-3 font-display text-3xl leading-[1.05] font-semibold md:text-4xl"
              >
                Tout pour réussir ton événement.
              </h2>
              <p className="mt-3 text-sm text-fg-muted">
                De la mise en vente du premier billet aux souvenirs après l&apos;événement.
              </p>
            </div>

            <ul className="grid gap-x-10 sm:grid-cols-2">
              {BENEFITS.map(({ title, description }) => (
                <li key={title} className="border-t border-border py-5">
                  <h3 className="font-display text-lg font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Formules */}
        <section className="border-y border-border bg-bg-subtle" aria-labelledby="formules">
          <div className="container-page flex flex-col gap-10 py-16 md:py-20">
            <div className="max-w-2xl">
              <p className="eyebrow">Tarifs</p>
              <h2
                id="formules"
                className="mt-3 font-display text-3xl leading-[1.05] font-semibold md:text-4xl"
              >
                Des formules simples.
              </h2>
              <p className="mt-3 text-sm text-fg-muted">
                Commission unique de {Math.round(PLATFORM_COMMISSION_RATE * 100)} % en{" "}
                {CURRENCY_LABEL} sur les billets payants, sans engagement.
              </p>
            </div>

            <div className="grid gap-x-8 gap-y-10 md:grid-cols-3">
              {PLANS.map((plan) => (
                <article
                  key={plan.name}
                  className={
                    plan.highlighted
                      ? "flex flex-col gap-5 border-t-4 border-primary pt-4"
                      : "flex flex-col gap-5 border-t-4 border-border pt-4"
                  }
                >
                  <div className="flex flex-col gap-1.5">
                    <p className="eyebrow">{plan.highlighted ? "Le plus choisi" : "Formule"}</p>
                    <h3 className="font-display text-2xl font-semibold">{plan.name}</h3>
                    <p className="font-display text-3xl font-semibold tabular-nums">
                      {plan.price === "0" ? `0 ${CURRENCY_LABEL}` : plan.price}
                    </p>
                    <p className="text-sm text-fg-muted">{plan.tagline}</p>
                  </div>

                  <ul className="flex flex-col gap-2 border-t border-dashed border-border-strong pt-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-baseline gap-2.5 text-sm">
                        <span aria-hidden="true" className="font-semibold text-primary">
                          +
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <ButtonLink href={plan.href} variant={plan.variant} fullWidth className="mt-auto">
                    {plan.cta}
                  </ButtonLink>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
