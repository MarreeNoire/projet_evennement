import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Mentions Légales | Rassemble",
  description: "Informations légales concernant l'éditeur et l'hébergeur de Rassemble.",
};

export default async function MentionsLegalesPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex-1 py-10 space-y-8 max-w-4xl">
        <div className="border-b border-border pb-4">
          <h1 className="font-display text-3xl font-bold tracking-tight">Mentions Légales</h1>
          <p className="mt-1 text-xs text-fg-subtle">Informations réglementaires</p>
        </div>

        <Card className="p-6 md:p-8 space-y-6 text-sm text-fg-muted leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-fg">Éditeur du site</h2>
            <p>
              Plateforme <strong>Rassemble</strong><br />
              Société de technologie événementielle<br />
              Abidjan, Côte d&apos;Ivoire<br />
              Email : contact@rassemble.ci
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-fg">Hébergement</h2>
            <p>
              Hébergé sur infrastructure Cloud Supabase et Vercel Inc.
            </p>
          </section>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
