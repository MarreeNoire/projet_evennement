import { env } from "@/lib/env";
import { formatDateTime, formatPrice } from "@/lib/utils";

import { actionButton, callout, detailRow, layout, paragraph } from "./templates-layout";
import type { EmailMessage } from "./types";

/* =============================================================================
   Emails de billetterie
   ========================================================================== */

export interface WelcomeEmailInput {
  to: string;
  name?: string;
}

/** Bienvenue après inscription. */
export function welcomeEmail({ to, name }: WelcomeEmailInput): EmailMessage {
  const greeting = name ? `Bienvenue ${name} !` : "Bienvenue !";

  return {
    to: { email: to, name },
    subject: `${greeting} Découvre les événements près de toi`,
    tag: "welcome",
    html: layout({
      preheader: "Ton compte est prêt : découvre, réserve et rencontre la communauté.",
      title: greeting,
      content: [
        paragraph(
          "Ton compte est créé. Tu peux dès maintenant découvrir des événements, réserver ta place et rejoindre le salon communautaire de chaque événement.",
        ),
        actionButton(`${env.appUrl}/explorer`, "Explorer les événements"),
        callout(
          "À faire en premier : complète ton profil et choisis tes centres d'intérêt pour recevoir des recommandations adaptées.",
        ),
      ].join("\n"),
    }),
  };
}

export interface TicketEmailItem {
  reference: string;
  ticketTypeName: string;
  accessLevelLabel: string;
  holderName?: string | null;
  /** URL publique de l'image PNG du QR code. */
  qrImageUrl?: string;
  /** Lien vers la page du billet. */
  ticketUrl: string;
}

export interface TicketConfirmedEmailInput {
  to: string;
  name?: string;
  eventTitle: string;
  eventStartAt: string;
  venueName?: string | null;
  city?: string | null;
  organizerName: string;
  orderReference: string;
  totalAmount: number;
  salonUrl?: string | null;
  tickets: TicketEmailItem[];
}

/** Confirmation d'achat avec les billets et leur QR code. */
export function ticketConfirmedEmail(input: TicketConfirmedEmailInput): EmailMessage {
  const ticketsHtml = input.tickets
    .map(
      (ticket) => `<div style="margin:0 0 14px;padding:16px;border:1px solid #e7e5e4;border-radius:12px;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1c1917;">
          ${ticket.ticketTypeName} · ${ticket.accessLevelLabel}
        </p>
        <p style="margin:0 0 12px;font-size:13px;color:#57534e;">
          Référence ${ticket.reference}${ticket.holderName ? ` · ${ticket.holderName}` : ""}
        </p>
        ${
          ticket.qrImageUrl
            ? `<img src="${ticket.qrImageUrl}" width="150" height="150" alt="QR code du billet ${ticket.reference}" style="display:block;border-radius:8px;border:1px solid #e7e5e4;" />`
            : ""
        }
        <p style="margin:12px 0 0;">
          <a href="${ticket.ticketUrl}" style="color:#0f766e;font-size:13px;font-weight:600;text-decoration:none;">Ouvrir le billet en ligne</a>
        </p>
      </div>`,
    )
    .join("\n");

  return {
    to: { email: input.to, name: input.name },
    subject: `Tes billets pour ${input.eventTitle}`,
    tag: "ticket_confirmed",
    html: layout({
      preheader: `Commande ${input.orderReference} confirmée.`,
      title: "Ta place est confirmée",
      content: [
        paragraph(
          `Paiement reçu pour ${input.eventTitle}. Présente le QR code ci-dessous à l'entrée : il sera scanné une seule fois.`,
        ),
        `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;width:100%;">
          ${detailRow("Organisateur", input.organizerName)}
          ${detailRow("Date", formatDateTime(input.eventStartAt))}
          ${detailRow("Lieu", [input.venueName, input.city].filter(Boolean).join(", ") || "À confirmer")}
          ${detailRow("Commande", input.orderReference)}
          ${detailRow("Total payé", formatPrice(input.totalAmount))}
        </table>`,
        ticketsHtml,
        input.salonUrl ? actionButton(input.salonUrl, "Rejoindre le salon de l'événement") : "",
        callout(
          "Garde cet email : le QR code est nominatif et ne peut être utilisé qu'une seule fois.",
        ),
      ].join("\n"),
    }),
  };
}