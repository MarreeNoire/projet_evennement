"use client";

import { useState, useTransition } from "react";
import { Save, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/states";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function OrgSettingsForm() {
  const [orgName, setOrgName] = useState("Events Côte d'Ivoire Sarl");
  const [email, setEmail] = useState("contact@events.ci");
  const [phone, setPhone] = useState("+225 07 00 00 00 00");
  const [payoutProvider, setPayoutProvider] = useState("wave");
  const [payoutAccount, setPayoutAccount] = useState("+225 07 01 02 03 04");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
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
        const { data: authData } = await supabase.auth.getUser();

        if (authData?.user) {
          await supabase
            .from("organizations")
            .update({
              name: orgName.trim(),
              email: email.trim() || null,
              phone: phone.trim() || null,
              updated_at: new Date().toISOString(),
            } as any)
            .eq("owner_id", authData.user.id);
        }

        setSuccess("Paramètres et coordonnées de reversement mis à jour avec succès !");
      } catch (err: any) {
        setError("Erreur lors de la sauvegarde des paramètres.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <Alert tone="danger" title="Erreur">
          {error}
        </Alert>
      ) : null}

      {success ? (
        <Alert tone="success" title="Mise à jour réussie">
          {success}
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Identité de la Structure</CardTitle>
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
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="contactEmail" className="text-xs font-semibold text-fg">
                Email de contact
              </label>
              <input
                id="contactEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="contactPhone" className="text-xs font-semibold text-fg">
                Téléphone (Côte d&apos;Ivoire)
              </label>
              <input
                id="contactPhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coordonnées de Reversement Mobile Money</CardTitle>
          <CardDescription>Les fonds de la billetterie vous seront reversés sur ce numéro.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="providerSelect" className="text-xs font-semibold text-fg">
                Opérateur Mobile Money
              </label>
              <select
                id="providerSelect"
                value={payoutProvider}
                onChange={(e) => setPayoutProvider(e.target.value)}
                className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
              >
                <option value="wave">Wave Money</option>
                <option value="orange">Orange Money</option>
                <option value="mtn">MTN Mobile Money</option>
                <option value="moov">Moov Money</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="payoutNumber" className="text-xs font-semibold text-fg">
                Numéro du compte
              </label>
              <input
                id="payoutNumber"
                type="tel"
                value={payoutAccount}
                onChange={(e) => setPayoutAccount(e.target.value)}
                placeholder="+225 07..."
                className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" loading={pending} loadingLabel="Enregistrement...">
              <Save className="mr-2 size-4" /> Enregistrer les paramètres
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
