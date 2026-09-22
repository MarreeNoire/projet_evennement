import { z } from "zod";

/* =============================================================================
   Schémas de validation — authentification
   --------------------------------------------------------------------------
   Validés côté client (feedback immédiat) ET côté serveur (sécurité réelle).
   Les messages sont en français et exploitables directement dans les formulaires.
   ========================================================================== */

/** Mot de passe : 8 caractères minimum, au moins 1 lettre et 1 chiffre. */
const passwordSchema = z
  .string({ error: "Le mot de passe est requis." })
  .min(8, "8 caractères minimum.")
  .max(72, "72 caractères maximum.")
  .regex(/[A-Za-z]/, "Doit contenir au moins une lettre.")
  .regex(/[0-9]/, "Doit contenir au moins un chiffre.");

const emailSchema = z
  .string({ error: "L'adresse email est requise." })
  .trim()
  .toLowerCase()
  .email("Adresse email invalide.")
  .max(254, "Adresse email trop longue.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: "Le mot de passe est requis." }).min(1, "Le mot de passe est requis."),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.input<typeof loginSchema>;
export type LoginValues = z.output<typeof loginSchema>;

export const registerSchema = z
  .object({
    displayName: z
      .string({ error: "Ton nom d'affichage est requis." })
      .trim()
      .min(2, "2 caractères minimum.")
      .max(80, "80 caractères maximum."),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string({ error: "Confirme ton mot de passe." }),
    acceptTerms: z.literal(true, {
      error: "Tu dois accepter les conditions d'utilisation.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string({ error: "Confirme ton mot de passe." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
