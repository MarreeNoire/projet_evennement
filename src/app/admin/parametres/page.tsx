import { AdminSettingsForm } from "@/components/admin/admin-settings-form";

export const metadata = {
  title: "Paramètres Plateforme | Super Admin | Event",
  description: "Configuration générale des règles métier et taux de commission.",
};

export default async function AdminParametresPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Paramètres de la Plateforme</h1>
        <p className="text-sm text-fg-muted">
          Règles financières globales et configurations système.
        </p>
      </div>

      <AdminSettingsForm />
    </div>
  );
}
