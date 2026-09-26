import Link from "next/link";
import { QrCode, ShieldCheck, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const metadata = {
  title: "Guide du Check-in & Contrôle d'Accès | Event",
  description: "Guide complet d'utilisation du scanner de billets pour agents et organisateurs.",
};

export default async function GuideCheckInPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex-1 py-10 space-y-8 max-w-3xl">
        <ButtonLink href="/aide" variant="ghost" size="sm">
          <ArrowLeft className="mr-2 size-4" /> Retour au centre d&apos;aide
        </ButtonLink>

        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Guide du Check-in à l&apos;entrée</h1>
          <p className="mt-2 text-fg-muted text-sm leading-relaxed">
            Consignes d&apos;utilisation de l&apos;application web de contrôle d&apos;accès pour les organisateurs d&apos;événements et leurs agents de sécurité.
          </p>
        </div>

        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-bold text-fg flex items-center gap-2">
            <CheckCircle2 className="size-5 text-success" /> 1. Utilisation du scanner QR
          </h2>
          <p className="text-sm text-fg-muted leading-relaxed">
            Depuis votre smartphone ou tablette, connectez-vous avec votre compte organisateur et ouvrez la page <strong>/org/check-in</strong>. Autorisez l&apos;accès à l&apos;appareil photo pour scanner le QR Code affiché sur l&apos;écran du participant ou imprimé sur son billet.
          </p>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-bold text-fg flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" /> 2. Vérification des Niveaux d&apos;Accès (VIP / VVIP)
          </h2>
          <p className="text-sm text-fg-muted leading-relaxed">
            Lors du scan, l&apos;écran affiche le badge avec le code couleur correspondant (Standard, VIP, VVIP). Vérifiez la concordance du nom si une pièce d&apos;identité est exigée par l&apos;organisateur.
          </p>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
