import { ROUTES } from "@/lib/constants";

/* =============================================================================
   Navigation principale
   --------------------------------------------------------------------------
   Une seule source de vérité, partagée par l'en-tête, le menu mobile et le
   pied de page. Les libellés sont en français et les icônes servent
   uniquement d'appui visuel (le texte reste toujours présent).
   ========================================================================== */

export interface NavItem {
  href: string;
  label: string;
  /** Réservé aux utilisateurs connectés. */
  authenticated?: boolean;
  /** Réservé aux organisateurs. */
  organizerOnly?: boolean;
}

/** Navigation publique (utilisateur non connecté). */
export const PUBLIC_NAV: NavItem[] = [
  { href: ROUTES.explore, label: "Explorer" },
  { href: "/organisateurs", label: "Organisateurs" },
  { href: "/#principe", label: "Comment ça marche" },
];

/** Navigation de l'application (utilisateur connecté). */
export const APP_NAV: NavItem[] = [
  { href: ROUTES.home, label: "Accueil" },
  { href: ROUTES.explore, label: "Explorer" },
  { href: ROUTES.myTickets, label: "Mes billets", authenticated: true },
  { href: ROUTES.mySalons, label: "Mes salons", authenticated: true },
  { href: ROUTES.connections, label: "Connexions", authenticated: true },
];

export function getNavItems(user: { isOrganizer?: boolean } | null): NavItem[] {
  if (!user) return PUBLIC_NAV;
  const items: NavItem[] = [
    { href: ROUTES.home, label: "Accueil" },
    { href: ROUTES.explore, label: "Explorer" },
    { href: ROUTES.myTickets, label: "Mes billets", authenticated: true },
    { href: ROUTES.mySalons, label: "Mes salons", authenticated: true },
    { href: ROUTES.connections, label: "Connexions", authenticated: true },
  ];
  if (user.isOrganizer) {
    items.push({ href: ROUTES.orgDashboard, label: "Espace Organisateur", organizerOnly: true });
  }
  return items;
}

/** Navigation de l'espace organisateur. */
export const ORG_NAV: NavItem[] = [
  { href: `${ROUTES.orgDashboard}`, label: "Tableau de bord", organizerOnly: true },
  { href: `${ROUTES.orgDashboard}/evenements`, label: "Événements", organizerOnly: true },
  { href: `${ROUTES.orgDashboard}/billetterie`, label: "Billetterie", organizerOnly: true },
  { href: `${ROUTES.orgDashboard}/participants`, label: "Participants", organizerOnly: true },
  { href: `${ROUTES.orgDashboard}/check-in`, label: "Check-in", organizerOnly: true },
  { href: `${ROUTES.orgDashboard}/analytics`, label: "Statistiques", organizerOnly: true },
  { href: `${ROUTES.orgDashboard}/marketing`, label: "Marketing", organizerOnly: true },
  { href: `${ROUTES.orgDashboard}/equipe`, label: "Équipe", organizerOnly: true },
  { href: `${ROUTES.orgDashboard}/paiements`, label: "Paiements", organizerOnly: true },
  { href: `${ROUTES.orgDashboard}/parametres`, label: "Paramètres", organizerOnly: true },
];

/** Navigation de l'administration plateforme. */
export const ADMIN_NAV: NavItem[] = [
  { href: `${ROUTES.admin}/utilisateurs`, label: "Utilisateurs" },
  { href: `${ROUTES.admin}/evenements`, label: "Événements" },
  { href: `${ROUTES.admin}/paiements`, label: "Paiements" },
  { href: `${ROUTES.admin}/moderation`, label: "Modération" },
  { href: `${ROUTES.admin}/parametres`, label: "Paramètres" },
];

/** Liens du pied de page. */
export const FOOTER_SECTIONS = [
  {
    title: "Découvrir",
    links: [
      { href: ROUTES.explore, label: "Tous les événements" },
      { href: "/organisateurs", label: "Organisateurs" },
      { href: "/#principe", label: "Comment ça marche" },
    ],
  },
  {
    title: "Organiser",
    links: [
      { href: "/devenir-organisateur", label: "Devenir organisateur" },
      { href: `${ROUTES.orgDashboard}/evenements/nouveau`, label: "Créer un événement" },
      { href: "/devenir-organisateur#formules", label: "Tarifs et commission" },
    ],
  },
  {
    title: "Aide",
    links: [
      { href: "/aide", label: "Centre d'aide" },
      { href: "/contact", label: "Nous contacter" },
      { href: "/aide/check-in", label: "Guide du check-in" },
      { href: "/aide/paiement", label: "Moyens de paiement" },
    ],
  },
  {
    title: "Légal",
    links: [
      { href: "/cgu", label: "Conditions d'utilisation" },
      { href: "/confidentialite", label: "Confidentialité" },
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/cookies", label: "Cookies" },
    ],
  },
] as const;