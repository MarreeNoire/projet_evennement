import { Construction } from "lucide-react";

export const metadata = {
  title: "Maintenance en cours | Event",
  description: "Le site est momentanément indisponible pendant une intervention technique.",
};

export default function MaintenancePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-5 py-12">
      <section className="w-full max-w-lg border border-border bg-surface p-6 sm:p-9" aria-labelledby="maintenance-title">
        <span className="mb-6 flex size-12 items-center justify-center rounded-md bg-warning-subtle text-warning">
          <Construction className="size-6" aria-hidden="true" />
        </span>
        <h1 id="maintenance-title" className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Une courte intervention est en cours
        </h1>
        <p className="mt-3 text-sm leading-6 text-fg-muted">
          Le site revient dès que possible. Si tu venais de lancer un paiement, ne recommence pas tout de suite : vérifie d’abord ton espace billets ou contacte le support.
        </p>
        <p className="mt-6 border-t border-border pt-4 text-sm text-fg-subtle">
          Les paiements déjà confirmés restent enregistrés. Cette page ne remplace pas la page de secours configurée chez l’hébergeur si le serveur lui-même est arrêté.
        </p>
      </section>
    </main>
  );
}
