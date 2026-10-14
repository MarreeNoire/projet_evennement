"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Field, Input, fieldAriaProps } from "@/components/ui/field";
import { ROUTES } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";

/* Inscription : crée le compte Auth + profil public, gère la confirmation. */

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false as unknown as true,
    },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { display_name: values.displayName.trim(), phone: values.phone.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setServerError(
          /already registered|already exists|duplicate/i.test(error.message)
            ? "Un compte existe déjà avec cet email. Connecte-toi ou réinitialise ton mot de passe."
            : "Inscription impossible pour le moment. Réessaie dans un instant.",
        );
        return;
      }

      if (data.user && !data.session) {
        setEmailSent(values.email);
        return;
      }

      router.push(ROUTES.home);
      router.refresh();
    });
  });

  if (emailSent) {
    return (
      <Alert tone="success" title="Vérifie ta boîte email">
        Un lien de confirmation a été envoyé à <strong>{emailSent}</strong>. Clique dessus pour
        activer ton compte, puis connecte-toi.
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {serverError ? (
        <Alert tone="danger" title="Inscription impossible">
          {serverError}
        </Alert>
      ) : null}

      <Field
        label="Nom d'affichage"
        htmlFor="displayName"
        required
        hint="Visible par les autres participants"
        error={errors.displayName?.message}
      >
        <Input
          id="displayName"
          autoComplete="nickname"
          placeholder="Koffi A."
          invalid={Boolean(errors.displayName)}
          {...fieldAriaProps("displayName", { error: errors.displayName?.message })}
          {...register("displayName")}
        />
      </Field>

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

      <Field
        label="Numéro de téléphone"
        htmlFor="phone"
        required
        hint="Avec l'indicatif du pays"
        description="Utilisé pour préremplir tes achats de billets. Il reste privé."
        error={errors.phone?.message}
      >
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="+225 07 00 00 00"
          invalid={Boolean(errors.phone)}
          {...fieldAriaProps("phone", {
            error: errors.phone?.message,
            description: "Utilisé pour préremplir tes achats de billets. Il reste privé.",
          })}
          {...register("phone")}
        />
      </Field>

      <Field
        label="Mot de passe"
        htmlFor="password"
        required
        hint="8 caractères min., 1 lettre + 1 chiffre"
        error={errors.password?.message}
      >
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            className="pr-12"
            invalid={Boolean(errors.password)}
            {...fieldAriaProps("password", { error: errors.password?.message })}
            {...register("password")}
          />
          <button
            type="button"
            className="text-fg-muted hover:text-fg focus-visible:ring-border-focus absolute inset-y-0 right-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm focus-visible:ring-2 focus-visible:outline-none"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </Field>

      <Field
        label="Confirmer le mot de passe"
        htmlFor="confirmPassword"
        required
        error={errors.confirmPassword?.message}
      >
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            className="pr-12"
            invalid={Boolean(errors.confirmPassword)}
            {...fieldAriaProps("confirmPassword", { error: errors.confirmPassword?.message })}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            className="text-fg-muted hover:text-fg focus-visible:ring-border-focus absolute inset-y-0 right-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm focus-visible:ring-2 focus-visible:outline-none"
            aria-label={
              showConfirmPassword
                ? "Masquer la confirmation du mot de passe"
                : "Afficher la confirmation du mot de passe"
            }
            aria-pressed={showConfirmPassword}
            onClick={() => setShowConfirmPassword((visible) => !visible)}
          >
            {showConfirmPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </Field>

      <div>
        <label className="text-fg-muted flex cursor-pointer items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-[var(--color-primary-solid)]"
            {...register("acceptTerms")}
          />
          <span>
            J&apos;accepte les{" "}
            <Link href="/cgu" className="text-primary font-medium hover:underline">
              conditions d&apos;utilisation
            </Link>{" "}
            et la{" "}
            <Link href="/confidentialite" className="text-primary font-medium hover:underline">
              politique de confidentialité
            </Link>
            .
          </span>
        </label>
        {errors.acceptTerms ? (
          <p role="alert" className="text-danger mt-1.5 text-xs">
            {errors.acceptTerms.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" loading={pending} loadingLabel="Création du compte…" fullWidth>
        Créer mon compte
      </Button>
    </form>
  );
}
