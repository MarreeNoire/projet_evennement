"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Field, Input, fieldAriaProps } from "@/components/ui/field";
import { ROUTES } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput, type LoginValues } from "@/lib/validation/auth";

/* =============================================================================
   Formulaire de connexion
   --------------------------------------------------------------------------
   Authentifie via Supabase Auth (email + mot de passe), puis redirige vers
   `?redirect=` (page d'origine) ou l'accueil. Les erreurs Supabase sont
   traduites en français, sans jamais révéler si un email existe ou non
   au-delà de ce que Supabase expose déjà.
   ========================================================================== */

const FRIENDLY_ERRORS: Array<{ match: RegExp; message: string }> = [
  { match: /invalid login credentials/i, message: "Email ou mot de passe incorrect." },
  { match: /email not confirmed/i, message: "Confirme ton adresse email avant de te connecter (lien envoyé par email)." },
  { match: /too many requests|rate limit/i, message: "Trop de tentatives. Patiente quelques minutes puis réessaie." },
];

function friendlyError(raw: string): string {
  for (const { match, message } of FRIENDLY_ERRORS) {
    if (match.test(raw)) return message;
  }
  return "Connexion impossible pour le moment. Réessaie dans un instant.";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput, unknown, LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setServerError(friendlyError(error.message));
        return;
      }

      const redirect = searchParams.get("redirect");
      router.push(redirect && redirect.startsWith("/") ? redirect : ROUTES.home);
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {serverError ? (
        <Alert tone="danger" title="Connexion impossible">
          {serverError}
        </Alert>
      ) : null}

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

      <Field label="Mot de passe" htmlFor="password" required error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          invalid={Boolean(errors.password)}
          {...fieldAriaProps("password", { error: errors.password?.message })}
          {...register("password")}
        />
      </Field>

      <div className="flex items-center justify-between text-sm">
        <label className="flex cursor-pointer items-center gap-2 text-fg-muted">
          <input
            type="checkbox"
            className="size-4 accent-[var(--color-primary-solid)]"
            {...register("rememberMe")}
          />
          Rester connecté
        </label>
        <Link href={ROUTES.forgotPassword} className="font-medium text-primary hover:underline">
          Mot de passe oublié ?
        </Link>
      </div>

      <Button type="submit" loading={pending} loadingLabel="Connexion en cours…" fullWidth>
        Se connecter
      </Button>
    </form>
  );
}
