"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";

import { Alert } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { savePlatformCommissionAction } from "@/lib/admin/actions";

export function AdminSettingsForm({ initialCommissionPercent }: { initialCommissionPercent: number }) {
  const [commissionRate, setCommissionRate] = useState(initialCommissionPercent);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error ? <Alert tone="danger" title="Erreur">{error}</Alert> : null}
      {success ? <Alert tone="success" title="Configuration enregistrée">{success}</Alert> : null}
      <Card>
        <CardHeader>
          <CardTitle>Commission plateforme</CardTitle>
          <CardDescription>Ce taux sera appliqué aux nouvelles commandes. Les commandes déjà créées gardent leur montant enregistré.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm space-y-1.5">
            <label htmlFor="commissionRateInput" className="text-xs font-semibold text-fg">Taux de commission (%)</label>
            <input id="commissionRateInput" type="number" step="0.1" min="0" max="50" required value={commissionRate} onChange={(event) => setCommissionRate(event.target.value === "" ? 0 : Number(event.target.value))} className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none" />
            <p className="text-xs text-fg-muted">Valeur actuelle : {commissionRate}% · Devise : FCFA (XOF)</p>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={pending} loadingLabel="Enregistrement…"><Save className="mr-2 size-4" /> Enregistrer</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
