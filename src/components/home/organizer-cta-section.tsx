import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, MessageSquare, QrCode, Sparkles, Ticket } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export function OrganizerCtaSection() {
  const highlights = [
    {
      icon: Ticket,
      title: "Billetterie & Mobile Money",
      description: "Plusieurs types de billets, quotas, codes promo et paiement direct (Wave, Orange, MTN, Moov).",
    },
    {
      icon: MessageSquare,
      title: "Salon communautaire dédié",
      description: "Un espace d'échange exclusif pour rassembler tes participants avant, pendant et après l'événement.",
    },
    {
      icon: QrCode,
      title: "Contrôle d'accès & Check-in",
      description: "Scan des QR codes à l'entrée directement sur smartphone avec validation instantanée anti-fraude.",
    },
    {
      icon: BarChart3,
      title: "Suivi des ventes en direct",
      description: "Tableau de bord complet pour analyser ton taux de remplissage, tes revenus et tes participants.",
    },
  ];

  return (
    <section aria-labelledby="organizer-section-title" className="border-border border-b bg-surface py-12 md:py-16">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-bg p-6 sm:p-8 md:p-12 shadow-sm">
          {/* Badge & Titre */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Espace créateurs & organisateurs
            </div>
            <h2 id="organizer-section-title" className="font-display mt-4 text-2xl font-bold md:text-3xl lg:text-4xl text-fg">
              Donne vie à tes événements et rassemble ta communauté
            </h2>
            <p className="mt-3 text-sm md:text-base leading-relaxed text-fg-muted">
              Que tu organises un concert, une conférence, un atelier ou un festival, nous te fournissons tous les outils pour vendre tes billets et fidéliser ton audience.
            </p>
          </div>

          {/* Grille des fonctionnalités */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex flex-col gap-2.5 rounded-xl border border-border/80 bg-surface/80 p-4 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-fg">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-fg-muted">{item.description}</p>
                </div>
              );
            })}
          </div>

          {/* Actions CTA */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/60 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink href="/devenir-organisateur" size="lg" className="shadow-md">
                Devenir organisateur
                <ArrowRight className="size-4 ml-1" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="/devenir-organisateur#formules" variant="secondary" size="lg">
                Découvrir les offres & tarifs
              </ButtonLink>
            </div>

            <div className="flex items-center gap-2 text-xs text-fg-subtle">
              <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
              <span>Création rapide · Sans engagement</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
