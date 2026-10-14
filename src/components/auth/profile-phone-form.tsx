"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

import { Alert } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Field, Input, fieldAriaProps } from "@/components/ui/field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { phoneSchema } from "@/lib/validation/auth";

export function ProfilePhoneForm({ initialPhone }: { initialPhone: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Vérifie le numéro saisi.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data.user) throw new Error("Connecte-toi pour modifier ton numéro.");

        const { error: updateError } = await supabase
          .from("profile_contacts")
          .upsert(
            { user_id: data.user.id, phone: parsed.data, updated_at: new Date().toISOString() },
            { onConflict: "user_id" },
          );
        if (updateError) throw updateError;

        setPhone(parsed.data);
        setSuccess(true);
        router.refresh();
      } catch {
        setError("Impossible d'enregistrer le numéro. Réessaie dans un instant.");
      }
    });
  }

  return (
    <section
      aria-labelledby="telephone-paiement"
      className="border-border flex flex-col gap-4 border-t pt-8"
    >
      <div>
        <p className="eyebrow">Achats</p>
        <h2 id="telephone-paiement" className="font-display mt-1 text-2xl font-semibold">
          Numéro pour tes billets
        </h2>
        <p className="text-fg-muted mt-2 max-w-xl text-sm">
          Il sera prérempli au paiement et tu pourras encore le modifier. Ce numéro reste privé.
        </p>
      </div>

      {error ? (
        <Alert tone="danger" title="Enregistrement impossible">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert tone="success" title="Numéro enregistré">
          Ton prochain formulaire de commande sera prérempli avec ce numéro.
        </Alert>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="grid max-w-xl gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
      >
        <Field
          label="Numéro de téléphone"
          htmlFor="profilePhone"
          required
          hint="Avec l'indicatif du pays"
          description="Exemple : +225 07 00 00 00."
          error={error ?? undefined}
        >
          <Input
            id="profilePhone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setSuccess(false);
            }}
            placeholder="+225 07 00 00 00"
            disabled={pending}
            invalid={Boolean(error)}
            {...fieldAriaProps("profilePhone", {
              error: error ?? undefined,
              description: "Exemple : +225 07 00 00 00.",
            })}
          />
        </Field>
        <Button type="submit" loading={pending} loadingLabel="Enregistrement…">
          <Save aria-hidden="true" /> Enregistrer
        </Button>
      </form>
    </section>
  );
}
