import Link from "next/link";
import { HelpCircle, Search, Ticket, Smartphone, QrCode, Shield, ArrowRight } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const metadata = {
  title: "Centre d'Aide & FAQ | Event",
  description: "Trouve toutes les réponses à tes questions sur la billetterie et les salons.",
};

export default async function AidePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex-1 py-10 space-y-10">
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <h1 className="font-display text-3xl font-bold tracking-tight">Comment pouvons-nous t&apos;aider ?</h1>
          <p className="text-sm text-fg-muted">
            Recherche dans nos guides et notre foire aux questions.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          <Card interactive>
            <CardHeader>
              <Ticket className="size-6 text-primary mb-2" />
              <CardTitle className="text-lg">Billetterie & Achat</CardTitle>
              <CardDescription>Comment acheter un billet, annuler ou recevoir ma facture.</CardDescription>
            </CardHeader>
            <CardContent>
              <ButtonLink href="/aide/paiement" variant="ghost" size="sm">
                En savoir plus <ArrowRight className="ml-1 size-3.5" />
              </ButtonLink>
            </CardContent>
          </Card>

          <Card interactive>
            <CardHeader>
              <QrCode className="size-6 text-primary mb-2" />
              <CardTitle className="text-lg">Guide du Check-in</CardTitle>
              <CardDescription>Comment faire scanner mon badge ou gérer les entrées organisateur.</CardDescription>
            </CardHeader>
            <CardContent>
              <ButtonLink href="/aide/check-in" variant="ghost" size="sm">
                En savoir plus <ArrowRight className="ml-1 size-3.5" />
              </ButtonLink>
            </CardContent>
          </Card>

          <Card interactive>
            <CardHeader>
              <Smartphone className="size-6 text-primary mb-2" />
              <CardTitle className="text-lg">Moyens de Paiement</CardTitle>
              <CardDescription>Payer avec Wave, Orange Money, MTN MoMo, Moov Money et Visa.</CardDescription>
            </CardHeader>
            <CardContent>
              <ButtonLink href="/aide/paiement" variant="ghost" size="sm">
                En savoir plus <ArrowRight className="ml-1 size-3.5" />
              </ButtonLink>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
