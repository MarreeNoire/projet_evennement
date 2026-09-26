import { OrgCheckInScanner } from "@/components/events/org-check-in-scanner";

export const metadata = {
  title: "Contrôle d'accès & Check-in | Event",
  description: "Outil de validation et contrôle des billets à l'entrée des événements.",
};

export default async function OrgCheckInPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Outil de Check-in à l&apos;entrée</h1>
        <p className="text-sm text-fg-muted">
          Scannez le QR Code du billet sur smartphone/papier ou recherchez par nom.
        </p>
      </div>

      <OrgCheckInScanner />
    </div>
  );
}
