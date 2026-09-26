import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Gestion des Cookies | Event",
  description: "Information sur l'utilisation des témoins de connexion (cookies) sur Event.",
};

export default async function CookiesPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex-1 py-10 space-y-8 max-w-4xl">
        <div className="border-b border-border pb-4">
          <h1 className="font-display text-3xl font-bold tracking-tight">Politique d&apos;utilisation des Cookies</h1>
          <p className="mt-1 text-xs text-fg-subtle">Informations relatives à votre navigation</p>
        </div>

        <Card className="p-6 md:p-8 space-y-6 text-sm text-fg-muted leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-fg">1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
            <p>
              Un cookie est un petit fichier texte déposé sur votre appareil (smartphone, ordinateur) lors de la consultation de notre site. Il permet d&apos;assurer la persistance de votre session de connexion et de mémoriser vos préférences de thème.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-fg">2. Cookies essentiels</h2>
            <p>
              Ces cookies sont indispensables au fonctionnement du site (authentification Supabase, jetons de sécurité CSRF, préférences de mode sombre).
            </p>
          </section>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
