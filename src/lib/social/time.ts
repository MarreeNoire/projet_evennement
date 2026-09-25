/* Temps relatif en français : « à l'instant », « il y a 2 heures », « 12 sept. ». */

const relative = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

export function formatRelative(value: string | Date, now: Date = new Date()): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);

  if (abs < 60) return "à l'instant";
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), "hour");
  if (abs < 86_400 * 7) return relative.format(Math.round(seconds / 86_400), "day");

  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date);
}

/** Jour + mois court d'une date, en heure d'Abidjan (talons de billets, tampons). */
export function dayMonth(value: string | Date): { day: string; month: string; year: string } {
  const date = typeof value === "string" ? new Date(value) : value;
  const timeZone = "Africa/Abidjan";

  return {
    day: new Intl.DateTimeFormat("fr-FR", { timeZone, day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("fr-FR", { timeZone, month: "short" })
      .format(date)
      .replace(".", ""),
    year: new Intl.DateTimeFormat("fr-FR", { timeZone, year: "numeric" }).format(date),
  };
}
