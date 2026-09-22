"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Field, Input, fieldAriaProps } from "@/components/ui/field";
import { ROUTES } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth";

/* Nouveau mot de passe : utilisable uniquement avec une session de récupération valide. */

export function ResetPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) {
        setServerError("Lien invalide ou expiré. Redemande un lien de réinitialisation.");
        return;
      }
      router.push(ROUTES.home);
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
      <Field label="Nouveau mot de passe" htmlFor="password" required error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          invalid={Boolean(errors.password)}
          {...fieldAriaProps("password", { error: errors.password?.message })}
          {...register("password")}
        />
      </Field>
      <Field label="Confirmer" htmlFor="confirmPassword" required error={errors.confirmPassword?.message}>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          invalid={Boolean(errors.confirmPassword)}
          {...fieldAriaProps("confirmPassword", { error: errors.confirmPassword?.message })}
          {...register("confirmPassword")}
        />
      </Field>
      <Button type="submit" loading={pending} loadingLabel="Mise à jour…" fullWidth>
        Changer mon mot de passe
      </Button>
    </form>
  );
}
