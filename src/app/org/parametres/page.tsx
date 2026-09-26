import { OrgSettingsForm } from "@/components/events/org-settings-form";

export const metadata = {
  title: "Paramètres de l'Organisation | Event",
  description: "Configuration du profil organisateur et des coordonnées de virement.",
};

export default async function OrgParametresPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Paramètres de l&apos;Organisation</h1>
        <p className="text-sm text-fg-muted">
          Modifiez vos coordonnées, le nom légal de votre structure et vos numéros pour les virements Mobile Money.
        </p>
      </div>

      <OrgSettingsForm />
    </div>
  );
}
