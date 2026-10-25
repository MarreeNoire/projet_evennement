import type { Metadata } from "next";
import Link from "next/link";

import { BecomeOrganizerForm } from "@/components/auth/become-organizer-form";
import { EditorialShell } from "@/components/layout/editorial/editorial-shell";
import { APP_NAME, CURRENCY_LABEL, PLATFORM_COMMISSION_RATE, ROUTES } from "@/lib/constants";
import { createSupabaseServerClient, getCurrentProfile } from "@/lib/supabase/server";

import content from "@/components/editorial/editorial.module.css";
import shell from "@/components/layout/editorial/editorial-shell.module.css";

export const metadata: Metadata = { title: "Devenir organisateur" };

const BENEFITS = [
  {
    title: "Billetterie complète",
    description:
      "Plusieurs types de billets, quotas, dates de vente et codes promo, avec paiement mobile money et carte.",
  },
  {
    title: "Un salon pour ta communauté",
    description:
      "Chaque événement crée automatiquement son salon : publications, photos, sondages, programme et annonces pour les participants.",
  },
  {
    title: "Check-in par QR code",
    description:
      "Scanne les billets à l’entrée avec validation en temps réel côté serveur : plus de doublons, plus de fraude.",
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
    description: `Commission unique de ${Math.round(PLATFORM_COMMISSION_RATE * 100)} % par billet vendu, sans frais cachés.`,
  },
];

const PLANS = [
  {
    name: "Gratuit",
    price: `0 ${CURRENCY_LABEL}`,
    tagline: "Pour démarrer et tester la plateforme.",
    features: ["Création d’événement", "Billetterie basique", "Salon basique"],
    cta: "Créer mon compte",
    href: ROUTES.register,
    highlighted: false,
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
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Sur devis",
    tagline: "Grandes entreprises, conférences, universités.",
    features: ["Accompagnement dédié", "Intégrations sur mesure", "Volumes importants"],
    cta: "Nous contacter",
    href: "/contact",
    highlighted: false,
  },
];

export default async function BecomeOrganizerPage() {
  const profile = await getCurrentProfile();
  let hasOrganization = false;
  if (profile) {
    const supabase = await createSupabaseServerClient();
    const [{ data: owned }, { data: memberships }] = await Promise.all([
      supabase.from("organizations").select("id").eq("owner_id", profile.id).limit(1),
      supabase
        .from("organization_members")
        .select("id")
        .eq("user_id", profile.id)
        .eq("status", "active")
        .limit(1),
    ]);
    hasOrganization = Boolean(owned?.length || memberships?.length);
  }

  return (
    <EditorialShell>
      <div className={shell.wrap}>
        <div className={shell.page} style={{ display: "grid", gap: 56 }}>
          {/* Hero + activation */}
          <section className={content.heroSplit} aria-labelledby="organiser-titre">
            <div className={content.heroCopy}>
              <p className={shell.eyebrow}>Pour les organisateurs</p>
              <h1 id="organiser-titre" className={shell["page-title"]}>
                Organise ton événement, <em>{APP_NAME}</em> s’occupe du reste.
              </h1>
              <p className={content.heroLead}>
                Billetterie mobile money, check-in par QR code, salon communautaire et statistiques
                de vente : tout ce qu’il faut pour vendre des billets et garder le lien avec tes
                participants, avant, pendant et après.
              </p>
            </div>

            <div>
              {profile ? (
                hasOrganization ? (
                  <div className={content.organizerPanel}>
                    <h2>Vous êtes déjà organisateur.</h2>
                    <p>
                      Accédez directement à votre tableau de bord pour créer et gérer vos
                      événements.
                    </p>
                    <Link
                      href="/org"
                      className={`${shell.btn} ${shell["btn-primary"]} ${content.organizerPanelBtn}`}
                    >
                      Accéder à mon espace organisateur
                    </Link>
                  </div>
                ) : (
                  <BecomeOrganizerForm
                    user={{ displayName: profile.display_name }}
                    variant="editorial"
                  />
                )
              ) : (
                <div className={content.organizerPanel}>
                  <h2>Prêt à vous lancer ?</h2>
                  <p>
                    Créez votre compte gratuit en moins d’une minute pour activer votre espace
                    organisateur.
                  </p>
                  <Link
                    href={ROUTES.register}
                    className={`${shell.btn} ${shell["btn-primary"]} ${content.organizerPanelBtn}`}
                  >
                    Créer mon compte
                  </Link>
                  <Link
                    href={ROUTES.login}
                    className={`${shell.btn} ${shell["btn-outline"]} ${content.organizerPanelBtn}`}
                  >
                    Déjà inscrit ? Connexion
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Bénéfices */}
          <section aria-labelledby="avantages" className={content.benefitSplit}>
            <div className={content.heroCopy}>
              <p className={shell.eyebrow}>Ce qui est inclus</p>
              <h2 id="avantages" className={shell["section-title"]}>
                Tout pour réussir <em>ton événement.</em>
              </h2>
              <p className={content.heroLead}>
                De la mise en vente du premier billet aux souvenirs après l’événement.
              </p>
            </div>

            <ul className={content.benefitList}>
              {BENEFITS.map(({ title, description }) => (
                <li key={title}>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Formules */}
          <section aria-labelledby="formules" style={{ display: "grid", gap: 28 }}>
            <header className={`${shell["page-head"]} ${shell["page-head--split"]}`}>
              <div>
                <p className={shell.eyebrow}>Tarifs</p>
                <h2 id="formules" className={shell["section-title"]} style={{ marginTop: 10 }}>
                  Des formules simples.
                </h2>
              </div>
              <p className={shell["page-lead"]} style={{ maxWidth: "42ch" }}>
                Commission unique de {Math.round(PLATFORM_COMMISSION_RATE * 100)} % en{" "}
                {CURRENCY_LABEL} sur les billets payants, sans engagement.
              </p>
            </header>

            <div className={content.planGrid}>
              {PLANS.map((plan) => (
                <article
                  key={plan.name}
                  className={`${content.plan}${plan.highlighted ? ` ${content["plan--featured"]}` : ""}`}
                >
                  <div style={{ display: "grid", gap: 6 }}>
                    <p className={shell.eyebrow}>
                      {plan.highlighted ? "Le plus choisi" : "Formule"}
                    </p>
                    <h3 className={content.planName}>{plan.name}</h3>
                    <p className={content.planPrice}>{plan.price}</p>
                    <p className={content.planTagline}>{plan.tagline}</p>
                  </div>

                  <ul className={content.planFeatures}>
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.href}
                    className={`${shell.btn} ${plan.highlighted ? shell["btn-primary"] : shell["btn-outline"]} ${content.planCta}`}
                  >
                    {plan.cta}
                  </Link>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </EditorialShell>
  );
}
