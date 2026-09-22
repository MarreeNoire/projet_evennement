import { env, isEmailLive } from "@/lib/env";

import { ConsoleEmailProvider } from "./console";
import { ResendEmailProvider } from "./resend";
import { EmailError, type EmailMessage, type EmailProvider, type EmailSendResult } from "./types";

/* =============================================================================
   Envoi d'emails transactionnels
   --------------------------------------------------------------------------
   `sendEmail()` ne lève jamais d'exception bloquante pour l'appelant : un échec
   d'email ne doit pas faire échouer l'achat d'un billet. Les erreurs sont
   journalisées et retournées dans le résultat.
   ========================================================================== */

let cachedProvider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  cachedProvider ??= createEmailProvider();
  return cachedProvider;
}

function createEmailProvider(): EmailProvider {
  if (env.email.provider === "resend") {
    return new ResendEmailProvider();
  }

  return new ConsoleEmailProvider();
}

/**
 * Envoie un email et journalise les échecs sans interrompre le parcours métier.
 * Retourne `null` si l'envoi a échoué.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailSendResult | null> {
  if (!isEmailLive && env.isProduction) {
    console.error(
      "[email] EMAIL_PROVIDER=console en production : aucun email ne sera envoyé. " +
        "Renseigne RESEND_API_KEY et passe EMAIL_PROVIDER=resend.",
    );
  }

  try {
    return await getEmailProvider().send(message);
  } catch (error) {
    const details = error instanceof EmailError ? `${error.code} — ${error.message}` : error;
    console.error("[email] Échec de l'envoi :", details);
    return null;
  }
}

export { ConsoleEmailProvider, ResendEmailProvider };
export * from "./types";
export * from "./templates-layout";
export * from "./templates";
export * from "./templates-events";