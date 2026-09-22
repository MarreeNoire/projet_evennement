import { env } from "@/lib/env";

import { formatAddress, type EmailMessage, type EmailProvider, type EmailSendResult } from "./types";

/* =============================================================================
   Prestataire « console » — développement
   --------------------------------------------------------------------------
   N'envoie rien : affiche l'email dans la console du serveur. Permet de
   dérouler tout le parcours (confirmation, billet, rappels) sans compte Resend
   ni domaine vérifié.
   ========================================================================== */

export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console" as const;

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const recipients = (Array.isArray(message.to) ? message.to : [message.to])
      .map(formatAddress)
      .join(", ");

    const preview = stripHtml(message.html).slice(0, 400);

    console.info(
      [
        "",
        "┌─────────────────────────── EMAIL (mode console) ───────────────────────────",
        `│ De       : ${env.email.resend.from}`,
        `│ À        : ${recipients}`,
        `│ Objet    : ${message.subject}`,
        message.tag ? `│ Étiquette: ${message.tag}` : null,
        "│ Aperçu   :",
        ...preview.split("\n").map((line) => `│   ${line}`),
        "└────────────────────────────────────────────────────────────────────────────",
        "",
      ]
        .filter(Boolean)
        .join("\n"),
    );

    return {
      id: `console-${Date.now()}`,
      provider: this.name,
      skipped: true,
    };
  }
}

/** Version texte brut approximative, pour les aperçus en console. */
function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}