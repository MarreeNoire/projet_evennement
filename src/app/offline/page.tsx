import { ButtonLink } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

/* =============================================================================
   Page hors ligne (précahé par le service worker)
   --------------------------------------------------------------------------
   Servie quand aucune navigation n'est disponible (première visite hors
   connexion, page jamais consultée). Cette page doit rester légère et
   dépendre uniquement du cache ; elle affiche l'essentiel et un bouton
   pour renvoyer l'utilisateur vers une page déjà chez lui.
   ========================================================================== */

export const metadata = {
  title: "Hors ligne",
};

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="bg-bg text-fg flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <div
        aria-hidden="true"
        className="bg-primary-solid p-5 text-3xl"
        style={{ borderRadius: "26px" }}
      >
        📡
      </div>
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="font-display text-2xl font-bold tracking-tight">Tu es hors ligne</h1>
        <p className="text-fg-muted text-sm leading-relaxed">
          Event n&apos;a pas pu joindre le réseau. Les pages déjà visitées restent
          accessibles depuis leur cache ; reviens quand tu retrouves une
          connexion, tes données seront remises à jour automatiquement.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <ButtonLink href="/" prefetch={false}>
          <ArrowRight aria-hidden="true" className="size-4" />
          Retour à l&apos;accueil
        </ButtonLink>
        <ButtonLink href="/explorer" variant="secondary" prefetch={false}>
          Explorer les événements
        </ButtonLink>
      </div>
      <p className="text-fg-subtle text-xs">(Pas de données perdues — c&apos;est un simple cache.)</p>
    </main>
  );
}
