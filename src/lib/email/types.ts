/* =============================================================================
   Abstraction email transactionnel
   --------------------------------------------------------------------------
   Deux implémentations :
     * « console » : affiche l'email dans les logs (développement, sans clé) ;
     * « resend »  : envoi réel via Resend (production).
   ========================================================================== */

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailMessage {
  to: EmailAddress | EmailAddress[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /** Étiquette interne pour retrouver l'email dans les logs du prestataire. */
  tag?: string;
}

export interface EmailSendResult {
  id: string;
  provider: "console" | "resend";
  skipped?: boolean;
}

export interface EmailProvider {
  readonly name: "console" | "resend";
  send(message: EmailMessage): Promise<EmailSendResult>;
}

/** Erreur d'envoi d'email, message destiné aux logs serveur. */
export class EmailError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "EmailError";
    this.code = code;
  }
}

/** Normalise une adresse en « Nom <email> ». */
export function formatAddress(address: EmailAddress): string {
  return address.name ? `${address.name} <${address.email}>` : address.email;
}