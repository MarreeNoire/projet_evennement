import { ROUTES } from "@/lib/constants";
import { CalendarDays, MessageSquare, Ticket, Users, type LucideIcon } from "lucide-react";

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
  icon?: LucideIcon;
  /** Réservé aux utilisateurs connectés. */
  authenticated?: boolean;
  /** Réservé aux organisateurs. */
  organizerOnly?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Les modules principaux restent visibles comme des accès directs dans l'en-tête. */
export function getPrimaryNavItems(user: { isOrganizer?: boolean } | null): NavItem[] {
  return [
    { href: ROUTES.explore, label: "Événements", icon: CalendarDays },
    ...(user
      ? [
          { href: ROUTES.myTickets, label: "Mes billets", icon: Ticket },
          { href: ROUTES.mySalons, label: "Mes salons", icon: MessageSquare },
          { href: ROUTES.connections, label: "Réseau", icon: Users },
        ]
      : []),
  ];
}

/** Navigation regroupée par besoin pour séparer événements et compte. */
export function getNavGroups(user: { isOrganizer?: boolean } | null): NavGroup[] {
  if (!user) {
    return [
      { label: "Événements", items: [{ href: ROUTES.explore, label: "Explorer les événements" }] },
      {
        label: "À découvrir",
        items: [{ href: "/organisateurs", label: "Organisateurs" }],
      },
    ];
  }

  const groups: NavGroup[] = [
    {
      label: "Événements",
      items: [
        { href: ROUTES.explore, label: "Explorer les événements" },
        { href: ROUTES.myTickets, label: "Mes billets", authenticated: true },
        { href: ROUTES.mySalons, label: "Mes salons", authenticated: true },
      ],
    },
    {
      label: "Réseau",
      items: [{ href: ROUTES.connections, label: "Mes connexions", authenticated: true }],
    },
  ];

  if (user.isOrganizer) {
    groups.push({
      label: "Organisation",
      items: [{ href: ROUTES.orgDashboard, label: "Espace organisateur", organizerOnly: true }],
    });
  }

  return groups;
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
