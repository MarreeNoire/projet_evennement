"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Field, Input, fieldAriaProps } from "@/components/ui/field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth";

/* Mot de passe oublié : envoie le lien de réinitialisation (sans révéler l'existence du compte). */

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/nouveau-mot-de-passe`,
      });
      if (error) {
        setServerError("Envoi impossible pour le moment. Réessaie dans un instant.");
        return;
      }
      setDone(true);
    });
  });

  if (done) {
    return (
      <Alert tone="success" title="Email envoyé">
        Si un compte existe avec cette adresse, tu recevras un lien de réinitialisation.
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
      <Field label="Adresse email" htmlFor="email" required error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="koffi@example.ci"
          invalid={Boolean(errors.email)}
          {...fieldAriaProps("email", { error: errors.email?.message })}
          {...register("email")}
        />
      </Field>
      <Button type="submit" loading={pending} loadingLabel="Envoi en cours…" fullWidth>
        Envoyer le lien
      </Button>
    </form>
  );
}
