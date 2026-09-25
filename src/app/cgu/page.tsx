import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Conditions Générales d'Utilisation (CGU) | Rassemble",
  description: "Conditions d'utilisation de la plateforme événementielle et de billetterie Rassemble.",
};

export default async function CGUPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex-1 py-10 space-y-8 max-w-4xl">
        <div className="border-b border-border pb-4">
          <h1 className="font-display text-3xl font-bold tracking-tight">Conditions Générales d&apos;Utilisation (CGU)</h1>
          <p className="mt-1 text-xs text-fg-subtle">Dernière mise à jour : Septembre 2026</p>
        </div>

        <Card className="p-6 md:p-8 space-y-6 text-sm text-fg-muted leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-fg">1. Objet de la plateforme</h2>
            <p>
              Rsemble est une plateforme technologique permettant la réservation, la vente de billets et la mise en relation communautaire autour d&apos;événements en Côte d&apos;Ivoire et dans la sous-région.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-fg">2. Achats de billets et paiements Mobile Money</h2>
            <p>
              Toutes les transactions effectuées via Mobile Money (Wave, Orange Money, MTN MoMo, Moov) ou carte bancaire sont fermes et définitives. En cas d&apos;annulation d&apos;un événement par l&apos;organisateur, les modalités de remboursement sont régies selon le règlement de l&apos;organisateur et la politique de la plateforme.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-fg">3. Salons et comportement de la communauté</h2>
            <p>
              Les utilisateurs s&apos;engagent à respecter la charte de convivialité dans les salons communautaires d&apos;événements. Tout propos haineux, diffamatoire ou indésirable (spam) entraînera la suspension immédiate du compte.
            </p>
          </section>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
