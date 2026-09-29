"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Eye, Lock, Save } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/states";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { NotificationPreferenceRow } from "@/types/database";

const SALON_NOTIFICATION_TYPES = [
  "post_reply",
  "mention",
  "new_salon_post",
  "new_member",
  "organizer_announcement",
  "message",
] as const;
const CONNECTION_NOTIFICATION_TYPES = ["connection_request", "connection_accepted"] as const;

export function UserSettingsForm({
  initialVisibility = "public",
  initialNotificationPreferences,
}: {
  initialVisibility?: string;
  initialNotificationPreferences: NotificationPreferenceRow[];
}) {
  const router = useRouter();

  const preferenceEnabled = (types: readonly string[]) =>
    initialNotificationPreferences.some(
      (preference) => types.includes(preference.type) && preference.in_app,
    );
  const [eventReminders, setEventReminders] = useState(preferenceEnabled(["event_reminder"]));
  const [salonActivity, setSalonActivity] = useState(preferenceEnabled(SALON_NOTIFICATION_TYPES));
  const [connectionActivity, setConnectionActivity] = useState(
    preferenceEnabled(CONNECTION_NOTIFICATION_TYPES),
  );
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

        if (!authData.user) throw new Error("Connecte-toi pour enregistrer tes préférences.");

        const [profileUpdate, reminderUpdate, salonUpdate, connectionUpdate] = await Promise.all([
          supabase
            .from("profiles")
            .update({ visibility: visibility as any, updated_at: new Date().toISOString() } as any)
            .eq("id", authData.user.id),
          supabase
            .from("notification_preferences")
            .update({ in_app: eventReminders })
            .eq("user_id", authData.user.id)
            .eq("type", "event_reminder"),
          supabase
            .from("notification_preferences")
            .update({ in_app: salonActivity })
            .eq("user_id", authData.user.id)
            .in("type", [...SALON_NOTIFICATION_TYPES]),
          supabase
            .from("notification_preferences")
            .update({ in_app: connectionActivity })
            .eq("user_id", authData.user.id)
            .in("type", [...CONNECTION_NOTIFICATION_TYPES]),
        ]);
        const saveError =
          profileUpdate.error ??
          reminderUpdate.error ??
          salonUpdate.error ??
          connectionUpdate.error;
        if (saveError) throw new Error(saveError.message);

        setSuccess("Tes réglages et préférences de notification ont été enregistrés.");
      } catch (err: any) {
        setError(
          err instanceof Error ? err.message : "Erreur lors de la sauvegarde de tes réglages.",
        );
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
        <Alert tone="success" title="Préférences enregistrées">
          {success}
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="text-primary size-5" /> Notifications & Alertes
          </CardTitle>
          <CardDescription>
            Choisis comment nous t&apos;informons des événements et messages de salon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="border-border flex cursor-pointer items-center justify-between border-b pb-3 text-sm">
            <div>
              <p className="text-fg font-semibold">Rappels d&apos;événement</p>
              <p className="text-fg-muted text-xs">
                Recevoir une notification 24h avant le début d&apos;un événement réservé.
              </p>
            </div>
            <input
              type="checkbox"
              checked={eventReminders}
              onChange={(e) => setEventReminders(e.target.checked)}
              className="accent-primary size-4"
            />
          </label>

          <label className="border-border flex cursor-pointer items-center justify-between border-b pb-3 text-sm">
            <div>
              <p className="text-fg font-semibold">Activités dans les salons</p>
              <p className="text-fg-muted text-xs">
                Nouvelles publications, réponses, mentions et annonces dans tes salons.
              </p>
            </div>
            <input
              type="checkbox"
              checked={salonActivity}
              onChange={(e) => setSalonActivity(e.target.checked)}
              className="accent-primary size-4"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between text-sm">
            <div>
              <p className="text-fg font-semibold">Connexions et messages</p>
              <p className="text-fg-muted text-xs">
                Être averti des demandes et acceptations de connexion.
              </p>
            </div>
            <input
              type="checkbox"
              checked={connectionActivity}
              onChange={(e) => setConnectionActivity(e.target.checked)}
              className="accent-primary size-4"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="text-primary size-5" /> Visibilité du Profil
          </CardTitle>
          <CardDescription>
            Contrôle qui peut voir ton profil dans la recherche et le networking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="border-border focus:border-border-focus w-full rounded-md border bg-transparent p-2.5 text-sm focus:outline-none"
          >
            <option value="public">Visible par tous les utilisateurs (Recommandé)</option>
            <option value="members">
              Visible uniquement par les participants des mêmes événements
            </option>
            <option value="private">Privé (Masqué de la recherche)</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="text-primary size-5" /> Sécurité
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
