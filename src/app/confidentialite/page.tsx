import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Politique de Confidentialité | Rassemble",
  description: "Protection et traitement des données personnelles sur Rassemble.",
};

export default async function ConfidentialitePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex-1 py-10 space-y-8 max-w-4xl">
        <div className="border-b border-border pb-4">
          <h1 className="font-display text-3xl font-bold tracking-tight">Politique de Confidentialité</h1>
          <p className="mt-1 text-xs text-fg-subtle">Dernière mise à jour : Septembre 2026</p>
        </div>

        <Card className="p-6 md:p-8 space-y-6 text-sm text-fg-muted leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-fg">1. Collecte des données personnelles</h2>
            <p>
              Nous collectons uniquement les données strictement nécessaires à l&apos;émission de vos billets d&apos;accès, à l&apos;envoi des rappels et à la gestion de vos connexions communautaires (Nom, adresse email, numéro de téléphone Mobile Money).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-fg">2. Protection et confidentialité</h2>
            <p>
              Vos données ne sont ni vendues ni cédées à des tiers. Les organisateurs d&apos;événements ont accès uniquement aux listes d&apos;émargement et d&apos;accès des billets pour leurs propres événements.
            </p>
          </section>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
