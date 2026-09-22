import { z } from "zod";

/* =============================================================================
   Validation de l'environnement
   --------------------------------------------------------------------------
   L'application DOIT démarrer sans aucune clé (modes « mock » et « console »)
   pour être développée et testée intégralement hors ligne. Les variables ne
   deviennent obligatoires que lorsque le service concerné est activé.
   `assertProductionEnv()` refuse la production si une dépendance manque.
   ========================================================================== */

/** Valide souplement une URL (compatible zod 3 et 4). */
const optionalUrl = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^https?:\/\/.+/.test(value), {
    message: "L'URL doit commencer par http:// ou https://",
  });

const optionalString = z.string().trim().optional();

const rawEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  NEXT_PUBLIC_APP_URL: optionalUrl,
  NEXT_PUBLIC_APP_NAME: optionalString,
  NEXT_PUBLIC_CURRENCY: optionalString,
  PLATFORM_COMMISSION_RATE: z.coerce.number().min(0).max(1).default(0.05),

  PAYMENT_PROVIDER: z.enum(["mock", "cinetpay"]).default("mock"),
  EMAIL_PROVIDER: z.enum(["console", "resend"]).default("console"),

  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,

  RESEND_API_KEY: optionalString,
  EMAIL_FROM: optionalString,
  EMAIL_REPLY_TO: optionalString,

  CINETPAY_API_KEY: optionalString,
  CINETPAY_SITE_ID: optionalString,
  CINETPAY_SECRET_KEY: optionalString,
  CINETPAY_BASE_URL: optionalUrl,
  CINETPAY_CHANNELS: optionalString,

  CRON_SECRET: optionalString,
});

export type RawEnv = z.infer<typeof rawEnvSchema>;

function readRawEnv(): RawEnv {
  const parsed = rawEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  • ${issue.path.join(".") || "(racine)"} : ${issue.message}`)
      .join("\n");

    throw new Error(
      `Variables d'environnement invalides :\n${details}\n\n` +
        "Corrige ton fichier .env.local (modèle : .env.example).",
    );
  }

  return parsed.data;
}

const raw = readRawEnv();
const isProduction = raw.NODE_ENV === "production";

/** URL publique de l'application, sans slash final. */
export const APP_URL = (raw.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const env = {
  nodeEnv: raw.NODE_ENV,
  isProduction,
  appUrl: APP_URL,
  appName: raw.NEXT_PUBLIC_APP_NAME ?? "Rassemble",
  currency: raw.NEXT_PUBLIC_CURRENCY ?? "XOF",
  commissionRate: raw.PLATFORM_COMMISSION_RATE,

  payment: {
    provider: raw.PAYMENT_PROVIDER,
    cinetpay: {
      apiKey: raw.CINETPAY_API_KEY ?? "",
      siteId: raw.CINETPAY_SITE_ID ?? "",
      secretKey: raw.CINETPAY_SECRET_KEY ?? "",
      baseUrl: (raw.CINETPAY_BASE_URL ?? "https://api-checkout.cinetpay.com").replace(/\/+$/, ""),
      channels: raw.CINETPAY_CHANNELS ?? "ALL",
    },
  },

  email: {
    provider: raw.EMAIL_PROVIDER,
    resend: {
      apiKey: raw.RESEND_API_KEY ?? "",
      from: raw.EMAIL_FROM ?? "Rassemble <onboarding@resend.dev>",
      replyTo: raw.EMAIL_REPLY_TO ?? "",
    },
  },

  supabase: {
    url: raw.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: raw.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    serviceRoleKey: raw.SUPABASE_SERVICE_ROLE_KEY ?? "",
  },

  cronSecret: raw.CRON_SECRET ?? "",
} as const;

/* ---------------------------------------------------------------------------
   Disponibilité des services
   L'UI affiche un bandeau « mode démo » au lieu de planter lorsque Supabase
   n'est pas encore branché.
--------------------------------------------------------------------------- */

export const isSupabaseConfigured = Boolean(env.supabase.url) && Boolean(env.supabase.anonKey);

export const isSupabaseAdminConfigured =
  isSupabaseConfigured && Boolean(env.supabase.serviceRoleKey);

export const isPaymentsLive =
  env.payment.provider === "cinetpay" &&
  Boolean(env.payment.cinetpay.apiKey) &&
  Boolean(env.payment.cinetpay.siteId) &&
  Boolean(env.payment.cinetpay.secretKey);

export const isEmailLive = env.email.provider === "resend" && Boolean(env.email.resend.apiKey);

/** Variables manquantes pour les services actuellement activés (vide = prêt). */
export function getMissingEnv(): string[] {
  const missing: string[] = [];

  const requiresSupabase =
    isProduction || env.payment.provider === "cinetpay" || env.email.provider === "resend";

  if (requiresSupabase) {
    if (!env.supabase.url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!env.supabase.anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    if (!env.supabase.serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  if (env.payment.provider === "cinetpay") {
    if (!env.payment.cinetpay.apiKey) missing.push("CINETPAY_API_KEY");
    if (!env.payment.cinetpay.siteId) missing.push("CINETPAY_SITE_ID");
    if (!env.payment.cinetpay.secretKey) missing.push("CINETPAY_SECRET_KEY");
  }

  if (env.email.provider === "resend" && !env.email.resend.apiKey) {
    missing.push("RESEND_API_KEY");
  }

  if (isProduction) {
    if (!env.appUrl.startsWith("https://")) missing.push("NEXT_PUBLIC_APP_URL (https requis)");
    if (!env.cronSecret) missing.push("CRON_SECRET");
    if (!raw.EMAIL_FROM) missing.push("EMAIL_FROM (adresse expéditrice vérifiée)");
  }

  return missing;
}

/** Lève une erreur explicite si l'environnement de production est incomplet. */
export function assertProductionEnv(): void {
  const missing = getMissingEnv();

  if (missing.length > 0) {
    throw new Error(
      "Configuration incomplète pour la production. Variables manquantes :\n" +
        missing.map((name) => `  • ${name}`).join("\n") +
        "\n\nRenseigne-les dans les variables d'environnement (Vercel) puis redéploie.",
    );
  }
}