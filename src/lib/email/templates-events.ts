import { env } from "@/lib/env";
import { formatDateTime, formatPrice } from "@/lib/utils";

import { actionButton, callout, detailRow, layout, paragraph } from "./templates-layout";
import type { EmailMessage } from "./types";

/* =============================================================================
   Emails d'événement : rappel, annonce de l'organisateur, annulation
   ========================================================================== */

export interface EventReminderEmailInput {
  to: string;
  name?: string;
  eventTitle: string;
  eventStartAt: string;
  venueName?: string | null;
  address?: string | null;
  city?: string | null;
  ticketUrl: string;
  salonUrl?: string | null;
}

/** Rappel envoyé avant l'événement (cron). */
export function eventReminderEmail(input: EventReminderEmailInput): EmailMessage {
  const location = [input.venueName, input.address, input.city].filter(Boolean).join(", ");

  return {
    to: { email: input.to, name: input.name },
    subject: `C'est bientôt : ${input.eventTitle}`,
    tag: "event_reminder",
    html: layout({
      preheader: "Ton billet et toutes les informations pratiques.",
      title: `${input.eventTitle}, c'est bientôt`,
      content: [
        paragraph(
          "Ton événement approche. Pense à préparer ton QR code : il te sera demandé à l'entrée.",
        ),
        `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;width:100%;">
          ${detailRow("Début", formatDateTime(input.eventStartAt))}
          ${detailRow("Lieu", location || "À confirmer")}
        </table>`,
        actionButton(input.ticketUrl, "Ouvrir mon billet"),
        input.salonUrl
          ? paragraph(
              `Tu peux aussi rejoindre le salon communautaire pour organiser ton trajet et retrouver d'autres participants : ${input.salonUrl}`,
            )
          : "",
        callout("Le QR code est personnel : ne le partage pas et ne le publie pas."),
      ].join("\n"),
    }),
  };
}

export interface OrganizerAnnouncementEmailInput {
  to: string;
  name?: string;
  eventTitle: string;
  organizerName: string;
  announcementTitle: string;
  message: string;
  salonUrl: string;
}

/** Annonce officielle de l'organisateur (changement d'horaire, info pratique…). */
export function organizerAnnouncementEmail(input: OrganizerAnnouncementEmailInput): EmailMessage {
  return {
    to: { email: input.to, name: input.name },
    subject: `${input.announcementTitle} — ${input.eventTitle}`,
    tag: "organizer_announcement",
    replyTo: env.email.resend.replyTo || undefined,
    html: layout({
      preheader: `Annonce de ${input.organizerName}.`,
      title: input.announcementTitle,
      content: [
        paragraph(`Annonce de ${input.organizerName} concernant ${input.eventTitle} :`),
        `<div style="margin:0 0 18px;padding:16px;background-color:#fafaf9;border-left:3px solid #0f766e;border-radius:8px;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#1c1917;white-space:pre-wrap;">${input.message}</p>
        </div>`,
        actionButton(input.salonUrl, "En savoir plus dans le salon"),
      ].join("\n"),
    }),
  };
}

export interface TicketCancelledEmailInput {
  to: string;
  name?: string;
  eventTitle: string;
  orderReference: string;
  amount: number;
  refunded: boolean;
  reason?: string | null;
}

/** Annulation ou remboursement d'une commande. */
export function ticketCancelledEmail(input: TicketCancelledEmailInput): EmailMessage {
  const title = input.refunded ? "Ta commande a été remboursée" : "Ta commande a été annulée";

  return {
    to: { email: input.to, name: input.name },
    subject: `${title} — ${input.eventTitle}`,
    tag: "ticket_cancelled",
    html: layout({
      preheader: `Commande ${input.orderReference}.`,
      title,
      content: [
        paragraph(
          input.refunded
            ? `La commande ${input.orderReference} pour ${input.eventTitle} a été remboursée. Le montant de ${formatPrice(input.amount)} sera recrédité selon les délais habituels de ton moyen de paiement.`
            : `La commande ${input.orderReference} pour ${input.eventTitle} a été annulée. Ses billets ne sont plus valides.`,
        ),
        `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;width:100%;">
          ${detailRow("Commande", input.orderReference)}
          ${detailRow("Montant", formatPrice(input.amount))}
        </table>`,
        input.reason ? callout(input.reason) : "",
      ].join("\n"),
    }),
  };
}