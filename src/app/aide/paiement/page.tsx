import { Smartphone, CreditCard, ArrowLeft } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const metadata = {
  title: "Moyens de Paiement | Event",
  description:
    "Explications sur les paiements Mobile Money (Wave, Orange, MTN, Moov) et Carte bancaire.",
};

export default async function GuidePaiementPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page max-w-3xl flex-1 space-y-8 py-10">
        <ButtonLink href="/aide" variant="ghost" size="sm">
          <ArrowLeft className="mr-2 size-4" /> Retour au centre d&apos;aide
        </ButtonLink>

        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Moyens de Paiement Acceptés
          </h1>
          <p className="text-fg-muted mt-2 text-sm leading-relaxed">
            Rassemble simplifie la billetterie en Côte d&apos;Ivoire. Le checkout sécurisé propose
            les moyens de paiement activés sur le compte marchand.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-fg mb-2 flex items-center gap-2 text-base font-bold">
              <Smartphone className="text-primary size-5" /> Mobile Money
            </h2>
            <ul className="text-fg-muted list-disc space-y-1.5 pl-4 text-xs">
              <li>
                <strong>Wave</strong>
              </li>
              <li>
                <strong>Orange Money</strong>
              </li>
              <li>
                <strong>MTN Mobile Money</strong>
              </li>
              <li>
                <strong>Moov Money</strong>
              </li>
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="text-fg mb-2 flex items-center gap-2 text-base font-bold">
              <CreditCard className="text-primary size-5" /> Carte Bancaire
            </h2>
            <p className="text-fg-muted text-xs">
              Paiement sécurisé Visa et Mastercard disponible pour les participants locaux et
              internationaux.
            </p>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
