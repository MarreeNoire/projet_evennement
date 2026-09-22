import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/* =============================================================================
   Helpers génériques
   ========================================================================== */

/** Fusionne des classes Tailwind en résolvant les conflits (dernier gagne). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Formate un montant en francs CFA. Ex : 10000 -> « 10 000 FCFA » */
export function formatPrice(amount: number | null | undefined): string {
  const value = Number(amount ?? 0);
  return `${formatNumber(value)} FCFA`;
}

/** Formate un nombre à la française. Ex : 2430 -> « 2 430 » */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
}

/** Formate un pourcentage. Ex : 0.92 -> « 92 % » */
export function formatPercent(ratio: number, fractionDigits = 0): string {
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(ratio * 100)} %`;
}

/** Date + heure en français. Ex : « sam. 15 novembre 2026 à 19:00 » */
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(toDate(date));
}

/** Date courte. Ex : « 15 nov. 2026 » */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(toDate(date));
}

/** Heure seule. Ex : « 19:00 » */
export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(toDate(date));
}

/**
 * Plage horaire lisible. Si les deux dates sont le même jour :
 * « sam. 15 nov. 2026 · 09:00 – 18:00 », sinon les deux dates complètes.
 */
export function formatDateRange(start: Date | string, end: Date | string): string {
  const from = toDate(start);
  const to = toDate(end);
  const sameDay =
    from.getFullYear() === to.getFullYear() &&
    from.getMonth() === to.getMonth() &&
    from.getDate() === to.getDate();

  return sameDay
    ? `${formatDate(from)} · ${formatTime(from)} – ${formatTime(to)}`
    : `${formatDate(from)} ${formatTime(from)} → ${formatDate(to)} ${formatTime(to)}`;
}

/** « il y a 3 minutes », « dans 2 jours » */
export function formatRelative(date: Date | string): string {
  const target = toDate(date);
  const diffMs = target.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60_000);
  const rtf = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });

  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHours = Math.round(diffMin / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, "day");
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, "month");
  return rtf.format(Math.round(diffMonths / 12), "year");
}

/** Sécurise la conversion en `Date`. */
export function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Initiales pour les avatars de secours. Ex : « Koffi Atta » -> « KA » */
export function getInitials(name: string, max = 2): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, max)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/** Tronque proprement un texte en respectant les mots. */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Convertit un texte en URL lisible. Ex : « Abidjan Tech Conf » -> « abidjan-tech-conf » */
export function toSlug(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Identifiant lisible pour les références de billet. Ex : « TCK-8F3K2P » */
export function generateReference(prefix = "TCK"): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return `${prefix}-${code}`;
}

/** Regroupe des éléments selon une clé de tri. */
export function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = keyFn(item);
      (acc[key] ||= []).push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

/** `true` si la date est passée. */
export function isPast(date: Date | string): boolean {
  return toDate(date).getTime() < Date.now();
}

/** Vérifie qu'une chaîne est une URL absolue exploitable. */
export function isAbsoluteUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}