import { Resend } from "resend";

import { env } from "@/lib/env";

import { EmailError, type EmailMessage, type EmailProvider, type EmailSendResult } from "./types";

/* =============================================================================
   Prestataire Resend — production
   --------------------------------------------------------------------------
   Prérequis (voir docs/DEPLOIEMENT.md) :
     1. domaine vérifié dans Resend (SPF + DKIM + DMARC) ;
     2. « Production Approval » obtenue, sinon Resend refuse d'envoyer à des
        destinataires arbitraires ;
     3. EMAIL_FROM défini sur une adresse du domaine vérifié.
   ========================================================================== */

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend" as const;

  private readonly client: Resend;

  constructor() {
    if (!env.email.resend.apiKey) {
      throw new EmailError(
        "NOT_CONFIGURED",
        "Resend n'est pas configuré : renseigne RESEND_API_KEY puis définis EMAIL_PROVIDER=resend.",
      );
    }

    this.client = new Resend(env.email.resend.apiKey);
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const { data, error } = await this.client.emails.send({
      from: env.email.resend.from,
      to: (Array.isArray(message.to) ? message.to : [message.to]).map((address) =>
        address.name ? `${address.name} <${address.email}>` : address.email,
      ),
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo ?? env.email.resend.replyTo ?? undefined,
      tags: message.tag ? [{ name: "type", value: message.tag }] : undefined,
    });

    if (error || !data) {
      throw new EmailError(
        "SEND_FAILED",
        `Échec de l'envoi à ${JSON.stringify(message.to)} : ${error?.message ?? "erreur inconnue"}`,
      );
    }

    return { id: data.id, provider: this.name };
  }
}