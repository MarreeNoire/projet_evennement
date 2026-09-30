"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/states";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type OrganizationSettings = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

export function OrgSettingsForm({ organization }: { organization: OrganizationSettings }) {
  const [orgName, setOrgName] = useState(organization.name);
  const [email, setEmail] = useState(organization.email ?? "");
  const [phone, setPhone] = useState(organization.phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orgName.trim()) {
      setError("Le nom de l'organisation est obligatoire.");
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) {
          setError("Ta session a expiré. Reconnecte-toi puis réessaie.");
          return;
        }

        const { data, error: updateError } = await supabase
          .from("organizations")
          .update({
            name: orgName.trim(),
            email: email.trim() || null,
            phone: phone.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", organization.id)
          .select("id")
          .maybeSingle();

        if (updateError || !data) {
          console.error("[OrgSettingsForm] Enregistrement de l'organisation impossible.", updateError?.message);
          setError("Impossible d'enregistrer ces coordonnées. Vérifie tes droits puis réessaie.");
          return;
        }

        setSuccess("Les coordonnées de l'organisation ont été enregistrées.");
      } catch {
        setError("La sauvegarde a échoué. Vérifie ta connexion puis réessaie.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? <Alert tone="danger" title="Erreur" floating onDismiss={() => setError(null)}>{error}</Alert> : null}
      {success ? <Alert tone="success" title="Mise à jour réussie">{success}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>Identité de la structure</CardTitle>
          <CardDescription>Ces coordonnées sont enregistrées sur le profil de votre organisation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="orgNameInput" className="text-xs font-semibold text-fg">
              Nom de l&apos;organisation / Entreprise *
            </label>
            <input
              id="orgNameInput"
              type="text"
              required
              value={orgName}
              onChange={(event) => setOrgName(event.target.value)}
              disabled={pending}
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none disabled:opacity-60"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="contactEmail" className="text-xs font-semibold text-fg">Email de contact</label>
              <input
                id="contactEmail"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={pending}
                className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none disabled:opacity-60"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="contactPhone" className="text-xs font-semibold text-fg">Téléphone (Côte d&apos;Ivoire)</label>
              <input
                id="contactPhone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                disabled={pending}
                className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paiements et reversements</CardTitle>
          <CardDescription>Les moyens de paiement disponibles aux acheteurs et les reversements sont configurés dans votre espace marchand GeniusPay.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-fg-muted">
            Les options activées par GeniusPay apparaissent au moment du paiement. Cette page ne stocke pas de coordonnées bancaires ou Mobile Money.
          </p>
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={pending} loadingLabel="Enregistrement…">
              <Save className="mr-2 size-4" aria-hidden="true" /> Enregistrer les coordonnées
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
