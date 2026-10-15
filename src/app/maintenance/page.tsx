import { Construction } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Maintenance en cours | Event",
  description: "Le site est momentanément indisponible pendant une intervention technique.",
};

export default function MaintenancePage() {
  return (
    <main className="bg-bg grid min-h-dvh place-items-center px-5 py-12">
      <section
        className="border-border bg-surface w-full max-w-lg border p-6 sm:p-9"
        aria-labelledby="maintenance-title"
      >
        <span className="bg-warning-subtle text-warning mb-6 flex size-12 items-center justify-center rounded-md">
          <Construction className="size-6" aria-hidden="true" />
        </span>
        <h1
          id="maintenance-title"
          className="font-display text-2xl font-bold tracking-tight sm:text-3xl"
        >
          Une courte intervention est en cours
        </h1>
        <p className="text-fg-muted mt-3 text-sm leading-6">
          Le site revient dès que possible. Si tu venais de lancer un paiement, ne recommence pas
          tout de suite : vérifie d’abord ton espace billets ou contacte le support.
        </p>
        <p className="border-border text-fg-subtle mt-6 border-t pt-4 text-sm">
          Les paiements déjà confirmés restent enregistrés. Cette page ne remplace pas la page de
          secours configurée chez l’hébergeur si le serveur lui-même est arrêté.
        </p>
        <Link
          href="/connexion"
          className="bg-primary-solid text-primary-solid-fg hover:bg-primary-solid-hover mt-6 inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors"
        >
          Connexion administrateur
        </Link>
      </section>
    </main>
  );
}
