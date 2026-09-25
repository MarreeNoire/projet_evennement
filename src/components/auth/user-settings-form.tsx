"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Eye, Lock, Save, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/states";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function UserSettingsForm({ initialVisibility = "public" }: { initialVisibility?: string }) {
  const router = useRouter();

  const [reminderEmails, setReminderEmails] = useState(true);
  const [salonActivity, setSalonActivity] = useState(true);
  const [recommendations, setRecommendations] = useState(false);
  const [visibility, setVisibility] = useState(initialVisibility);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: authData } = await supabase.auth.getUser();

        if (authData?.user) {
          await supabase
            .from("profiles")
            .update({
              visibility: visibility as any,
              updated_at: new Date().toISOString(),
            } as any)
            .eq("id", authData.user.id);
        }

        setSuccess("Vos réglages et préférences de visibilité ont été enregistrés.");
      } catch (err: any) {
        setError("Erreur lors de la sauvegarde de vos réglages.");
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
        <Alert tone="success" title="Préférences enregistrées">
          {success}
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="size-5 text-primary" /> Notifications & Alertes
          </CardTitle>
          <CardDescription>
            Choisis comment nous t&apos;informons des événements et messages de salon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between text-sm cursor-pointer border-b border-border pb-3">
            <div>
              <p className="font-semibold text-fg">Emails de rappel d&apos;événement</p>
              <p className="text-xs text-fg-muted">Recevoir un rappel 24h avant le début d&apos;un événement réservé.</p>
            </div>
            <input
              type="checkbox"
              checked={reminderEmails}
              onChange={(e) => setReminderEmails(e.target.checked)}
              className="size-4 accent-primary"
            />
          </label>

          <label className="flex items-center justify-between text-sm cursor-pointer border-b border-border pb-3">
            <div>
              <p className="font-semibold text-fg">Activités dans les salons</p>
              <p className="text-xs text-fg-muted">Notifications lorsque quelqu&apos;un répond à tes publications.</p>
            </div>
            <input
              type="checkbox"
              checked={salonActivity}
              onChange={(e) => setSalonActivity(e.target.checked)}
              className="size-4 accent-primary"
            />
          </label>

          <label className="flex items-center justify-between text-sm cursor-pointer">
            <div>
              <p className="font-semibold text-fg">Offres & événements recommandés</p>
              <p className="text-xs text-fg-muted">Recevoir nos suggestions selon tes thématiques préférées.</p>
            </div>
            <input
              type="checkbox"
              checked={recommendations}
              onChange={(e) => setRecommendations(e.target.checked)}
              className="size-4 accent-primary"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="size-5 text-primary" /> Visibilité du Profil
          </CardTitle>
          <CardDescription>
            Contrôle qui peut voir ton profil dans la recherche et le networking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full rounded-md border border-border bg-transparent p-2.5 text-sm focus:border-border-focus focus:outline-none"
          >
            <option value="public">Visible par tous les utilisateurs (Recommandé)</option>
            <option value="members">Visible uniquement par les participants des mêmes événements</option>
            <option value="private">Privé (Masqué de la recherche)</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="size-5 text-primary" /> Sécurité
          </CardTitle>
          <CardDescription>Modification du mot de passe et sécurité de connexion.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/mot-de-passe-oublie")}
          >
            Changer mon mot de passe
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={pending} loadingLabel="Sauvegarde...">
          <Save className="mr-2 size-4" /> Enregistrer les réglages
        </Button>
      </div>
    </form>
  );
}
