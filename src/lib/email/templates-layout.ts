import { APP_NAME } from "@/lib/constants";
import { env } from "@/lib/env";

/* =============================================================================
   Gabarit des emails transactionnels (HTML, styles en ligne)
   --------------------------------------------------------------------------
   Styles en ligne : c'est ce qui s'affiche le plus fidèlement dans Gmail,
   Outlook et les clients mobiles. Aucune dépendance externe, donc aucun risque
   de rupture liée à un paquet déprécié.
   ========================================================================== */

const COLORS = {
  bg: "#fafaf9",
  surface: "#ffffff",
  border: "#e7e5e4",
  text: "#1c1917",
  muted: "#57534e",
  primary: "#0f766e",
  primaryFg: "#ffffff",
  accentBg: "#fffbeb",
  accentText: "#b45309",
} as const;

/** Échappe les données utilisateur insérées dans le HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface LayoutOptions {
  preheader: string;
  title: string;
  content: string;
}

/** Gabarit commun à tous les emails. */
export function layout({ preheader, title, content }: LayoutOptions): string {
  const supportEmail = env.email.resend.replyTo || "support@rassemble.ci";

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${COLORS.bg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${COLORS.text};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bg};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;border-bottom:1px solid ${COLORS.border};">
                <span style="font-size:18px;font-weight:700;color:${COLORS.primary};letter-spacing:-0.02em;">${escapeHtml(APP_NAME)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:${COLORS.text};">${escapeHtml(title)}</h1>
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:1px solid ${COLORS.border};color:${COLORS.muted};font-size:12px;line-height:1.5;">
                <p style="margin:0 0 6px;">Cet email t'a été envoyé par ${escapeHtml(APP_NAME)}.</p>
                <p style="margin:0;">Besoin d'aide ? Écris-nous à
                  <a href="mailto:${escapeHtml(supportEmail)}" style="color:${COLORS.primary};text-decoration:none;">${escapeHtml(supportEmail)}</a>.
                </p>
              </td>
            </tr>
          </table>
          <p style="max-width:560px;margin:16px 0 0;color:${COLORS.muted};font-size:11px;text-align:center;">
            ${escapeHtml(env.appUrl)}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Bouton d'action, compatible clients mail. */
export function actionButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>
      <td style="background-color:${COLORS.primary};border-radius:10px;">
        <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;color:${COLORS.primaryFg};font-size:15px;font-weight:600;text-decoration:none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

/** Ligne d'information « libellé / valeur ». */
export function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:${COLORS.muted};font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>
    <td style="padding:6px 0 6px 12px;color:${COLORS.text};font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
  </tr>`;
}

/** Paragraphe de corps. */
export function paragraph(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${COLORS.text};">${escapeHtml(text)}</p>`;
}

/** Encart d'information complémentaire. */
export function callout(text: string): string {
  return `<div style="margin:18px 0 0;padding:12px 14px;background-color:${COLORS.accentBg};border-radius:10px;color:${COLORS.accentText};font-size:13px;line-height:1.5;">${escapeHtml(text)}</div>`;
}