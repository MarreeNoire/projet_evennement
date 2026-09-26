import Link from "next/link";
import { Mail, Phone, MapPin, Send } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Nous Contacter | Event",
  description: "Contacte l'équipe Event pour toute question ou demande de partenariat.",
};

export default async function ContactPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex-1 py-10 space-y-8 max-w-4xl">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h1 className="font-display text-3xl font-bold tracking-tight">Contactez-nous</h1>
          <p className="text-sm text-fg-muted">
            Une question sur un événement, votre billet ou un partenariat ? Écrivez-nous.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <Card className="p-6 space-y-4 md:col-span-1">
            <h2 className="font-bold text-base text-fg">Coordonnées</h2>
            <div className="space-y-3 text-xs text-fg-muted">
              <p className="flex items-center gap-2">
                <Mail className="size-4 text-primary" /> contact@rassemble.ci
              </p>
              <p className="flex items-center gap-2">
                <Phone className="size-4 text-primary" /> +225 07 00 00 00 00
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="size-4 text-primary shrink-0" /> Abidjan, Côte d&apos;Ivoire
              </p>
            </div>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Envoyer un message</CardTitle>
              <CardDescription>Remplissez le formulaire ci-dessous et notre équipe vous répondra sous 24h.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">Votre Nom *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nom complet"
                      className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg">Adresse Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="nom@exemple.ci"
                      className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">Sujet *</label>
                  <select className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none">
                    <option value="support">Support Billet & Achat</option>
                    <option value="organisateur">Devenir Organisateur / Partenariat</option>
                    <option value="other">Autre demande</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">Message *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Expliquez-nous votre besoin…"
                    className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit">
                    <Send className="mr-2 size-4" /> Envoyer le message
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
