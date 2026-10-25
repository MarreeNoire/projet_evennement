import { ROUTES } from "@/lib/constants";

/* Navigation du parcours public éditorial. Partagée par l'en-tête, le menu
   mobile et le shell : une seule source de vérité, pas de doublon. */

export interface EditorialNavItem {
  label: string;
  href: string;
}

export const EDITORIAL_NAV: EditorialNavItem[] = [
  { label: "Événements", href: ROUTES.explore },
  { label: "Organisateurs", href: "/organisateurs" },
  { label: "Aide", href: "/aide" },
  { label: "Organiser", href: "/devenir-organisateur" },
];
