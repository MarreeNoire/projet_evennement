"use client";

import { useState, useTransition } from "react";
import { Construction, Save } from "lucide-react";

import { Alert } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { savePlatformCommissionAction, setPlatformMaintenanceAction } from "@/lib/admin/actions";

export function AdminSettingsForm({
  initialCommissionPercent,
  initialMaintenanceMode,
}: {
  initialCommissionPercent: number;
  initialMaintenanceMode: boolean;
}) {
  const [commissionRate, setCommissionRate] = useState(initialCommissionPercent);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [maintenanceMode, setMaintenanceMode] = useState(initialMaintenanceMode);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await savePlatformCommissionAction(commissionRate);
        if (result.error) setError(result.error);
        else setSuccess(result.success ?? "Configuration enregistrée.");
      } catch {
        setError("La sauvegarde a échoué. Vérifiez votre connexion et réessayez.");
      }
    });
  }

  function toggleMaintenance() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const nextMode = !maintenanceMode;
        const result = await setPlatformMaintenanceAction(nextMode);
        if (result.error) setError(result.error);
        else {
          setMaintenanceMode(nextMode);
          setSuccess(result.success ?? "Mode maintenance modifié.");
        }
      } catch {
        setError("La modification a échoué. Vérifie ta connexion puis réessaie.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error ? (
        <Alert tone="danger" title="Erreur">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert tone="success" title="Configuration enregistrée">
          {success}
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Commission plateforme</CardTitle>
          <CardDescription>
            Ce taux sera appliqué aux nouvelles commandes. Les commandes déjà créées gardent leur
            montant enregistré.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm space-y-1.5">
            <label htmlFor="commissionRateInput" className="text-fg text-xs font-semibold">
              Taux de commission (%)
            </label>
            <input
              id="commissionRateInput"
              type="number"
              step="0.1"
              min="0"
              max="50"
              required
              value={commissionRate}
              onChange={(event) =>
                setCommissionRate(event.target.value === "" ? 0 : Number(event.target.value))
              }
              className="border-border focus:border-border-focus w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none"
            />
            <p className="text-fg-muted text-xs">
              Valeur actuelle : {commissionRate}% · Devise : FCFA (XOF)
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={pending} loadingLabel="Enregistrement…">
              <Save className="mr-2 size-4" /> Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Maintenance du site</CardTitle>
          <CardDescription>
            Les visiteurs voient une page dédiée. Les administrateurs connectés gardent accès à tout
            le site pour le vérifier. Les nouvelles commandes restent suspendues pendant
            l’intervention, et les notifications du prestataire de paiement continuent d’être
            reçues.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-warning-subtle text-warning flex size-10 shrink-0 items-center justify-center rounded-md">
              <Construction className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-fg font-semibold">
                {maintenanceMode ? "Maintenance activée" : "Site accessible"}
              </p>
              <p className="text-fg-muted text-sm">
                {maintenanceMode
                  ? "Les visiteurs ne peuvent pas démarrer de commande."
                  : "Les pages publiques et les paiements sont disponibles."}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant={maintenanceMode ? "secondary" : "danger"}
            loading={pending}
            onClick={toggleMaintenance}
          >
            {maintenanceMode ? "Rouvrir le site" : "Activer la maintenance"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
