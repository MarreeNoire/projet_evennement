import type { PublishedEventView } from "@/types/database";
import { formatNumber } from "@/lib/utils";

export const HOME_CATEGORIES = [
  {
    slug: "concerts",
    label: "Concerts",
    subtitle: "Lives, festivals & scènes",
    color: "from-[#d4512c] via-[#425dc6] to-[#202a35]",
  },
  {
    slug: "conferences",
    label: "Conférences",
    subtitle: "Tech, sommets & panels",
    color: "from-[#286d7c] via-[#3e51a8] to-[#202a35]",
  },
  {
    slug: "salons",
    label: "Salons",
    subtitle: "Expos, foires & business",
    color: "from-[#7188f2] via-[#425dc6] to-[#202a35]",
  },
  {
    slug: "formations",
    label: "Formations",
    subtitle: "Ateliers, bootcamps & cours",
    color: "from-[#d5a638] via-[#d4512c] to-[#202a35]",
  },
  {
    slug: "sport",
    label: "Sport",
    subtitle: "Tournois, marathons & matchs",
    color: "from-[#f08d62] via-[#b83f22] to-[#202a35]",
  },
  {
    slug: "culture",
    label: "Culture",
    subtitle: "Théâtre, art, danse & mode",
    color: "from-[#9fdae5] via-[#286d7c] to-[#202a35]",
  },
] as const;

/** Récupère la couverture du premier événement réel publié pour cette catégorie */
export function getCategoryCover(categorySlug: string, events: PublishedEventView[]): string | null {
  const match = events.find(
    (e) => e.category === categorySlug && (e.cover_url || e.gallery?.[0])
  );
  return match?.cover_url ?? match?.gallery?.[0] ?? null;
}

export function formatEventPrice(event: Pick<PublishedEventView, "min_price" | "max_price" | "currency">): string {
  if (event.min_price <= 0 && event.max_price <= 0) return "Entrée libre";
  const currency = event.currency === "XOF" ? "FCFA" : event.currency;
  return `Dès ${formatNumber(event.min_price)} ${currency}`;
}

export function formatEventDate(dateString: string): {
  weekday: string;
  dayMonth: string;
  time: string;
  fullBadge: string;
} {
  const date = new Date(dateString);
  const weekday = new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "Africa/Abidjan" }).format(date);
  const day = new Intl.DateTimeFormat("fr-FR", { day: "numeric", timeZone: "Africa/Abidjan" }).format(date);
  const month = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "Africa/Abidjan" }).format(date);
  const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Abidjan" }).format(date);

  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);

  return {
    weekday: capitalizedWeekday,
    dayMonth: `${day} ${capitalizedMonth}`,
    time,
    fullBadge: `${capitalizedWeekday} ${day} ${capitalizedMonth} · ${time}`,
  };
}

export function getRelativeTimeTag(dateString: string): string {
  const target = new Date(dateString).getTime();
  const now = Date.now();
  const diffDays = Math.round((target - now) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return "Demain";
  if (diffDays <= 3) return `Dans ${diffDays} jours`;
  if (diffDays <= 7) return "Cette semaine";
  return "À venir";
}
