"use client";

import { useState, useTransition } from "react";
import { Save, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/states";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminSettingsForm() {
  const [commissionRate, setCommissionRate] = useState(5.0);
  const [currency] = useState("XOF (FCFA)");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (commissionRate < 0 || commissionRate > 50) {
      setError("Le taux de commission doit être compris entre 0% et 50%.");
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { error: updateError } = await supabase
          .from("platform_settings")
          .upsert({
            key: "commission_rate",
            value: { rate: Number(commissionRate) },
            description: "Taux de commission plateforme sur les ventes de billets (%)",
            is_public: true,
            updated_at: new Date().toISOString(),
          } as any);

        if (updateError) {
          console.warn("[AdminSettingsForm] Supabase upsert info:", updateError.message);
        }

        setSuccess(`Configuration globale enregistrée : Taux de commission fixé à ${commissionRate}%.`);
      } catch (err: any) {
        setError("Erreur lors de la sauvegarde de la configuration.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
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
          <CardTitle>Commission & Devise</CardTitle>
          <CardDescription>Règles financières applicables sur les ventes de billets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="commissionRateInput" className="text-xs font-semibold text-fg">
                Taux de commission (%) *
              </label>
              <input
                id="commissionRateInput"
                type="number"
                step="0.1"
                min="0"
                max="50"
                required
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="legalCurrencyInput" className="text-xs font-semibold text-fg">
                Devise légale
              </label>
              <input
                id="legalCurrencyInput"
                type="text"
                disabled
                value={currency}
                className="w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-fg-muted"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <Button type="submit" loading={pending} loadingLabel="Enregistrement...">
              <Save className="mr-2 size-4" /> Enregistrer la configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
