import Link from "next/link";
import { Smartphone, CreditCard, ShieldCheck, ArrowLeft } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const metadata = {
  title: "Moyens de Paiement | Event",
  description: "Explications sur les paiements Mobile Money (Wave, Orange, MTN, Moov) et Carte bancaire.",
};

export default async function GuidePaiementPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex-1 py-10 space-y-8 max-w-3xl">
        <ButtonLink href="/aide" variant="ghost" size="sm">
          <ArrowLeft className="mr-2 size-4" /> Retour au centre d&apos;aide
        </ButtonLink>

        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Moyens de Paiement Acceptés</h1>
          <p className="mt-2 text-fg-muted text-sm leading-relaxed">
            Rsemble simplifie la billetterie en Côte d&apos;Ivoire en acceptant les solutions de paiement mobile les plus populaires.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-bold text-base text-fg flex items-center gap-2 mb-2">
              <Smartphone className="size-5 text-primary" /> Mobile Money
            </h2>
            <ul className="text-xs text-fg-muted space-y-1.5 list-disc pl-4">
              <li><strong>Wave</strong> (Scan QR direct ou OTP)</li>
              <li><strong>Orange Money</strong> (Code USSD #144# / CinetPay)</li>
              <li><strong>MTN Mobile Money</strong></li>
              <li><strong>Moov Money</strong></li>
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="font-bold text-base text-fg flex items-center gap-2 mb-2">
              <CreditCard className="size-5 text-primary" /> Carte Bancaire
            </h2>
            <p className="text-xs text-fg-muted">
              Paiement sécurisé Visa et Mastercard disponible pour les participants locaux et internationaux.
            </p>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
