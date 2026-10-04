/* =============================================================================
   Constantes métier — source unique de vérité (cf. cahier des charges)
   ========================================================================== */

/** Nom de la plateforme. */
export const APP_NAME = "Event";

/** Devise unique de la plateforme. */
export const CURRENCY = "XOF" as const;
export const CURRENCY_LABEL = "FCFA" as const;

/** Commission prélevée par la plateforme sur chaque commande. */
export const PLATFORM_COMMISSION_RATE = Number(process.env.PLATFORM_COMMISSION_RATE ?? 0.05);

/** Rôles applicatifs (RBAC). Un utilisateur peut cumuler plusieurs rôles. */
export const ROLES = {
  PARTICIPANT: "participant",
  ORGANIZER: "organizer",
  ADMIN: "admin",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Rôles au sein d'une organisation (équipe d'un organisateur). */
export const ORG_ROLES = {
  OWNER: "owner",
  MANAGER: "manager",
  CHECKIN_AGENT: "checkin_agent",
  MODERATOR: "moderator",
} as const;
export type OrgRole = (typeof ORG_ROLES)[keyof typeof ORG_ROLES];

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Propriétaire",
  manager: "Gestionnaire",
  checkin_agent: "Agent de contrôle",
  moderator: "Modérateur",
};

/** Niveaux d'accès débloqués par un type de billet. */
export const ACCESS_LEVELS = {
  STANDARD: "standard",
  VIP: "vip",
  VVIP: "vvip",
} as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[keyof typeof ACCESS_LEVELS];

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  standard: "Standard",
  vip: "VIP",
  vvip: "VVIP",
};

/** Cycle de vie d'un billet (cf. §11 du cahier). */
export const TICKET_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  USED: "used",
  EXPIRED: "expired",
} as const;
export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  pending: "En attente de paiement",
  paid: "Valide",
  cancelled: "Annulé",
  refunded: "Remboursé",
  used: "Déjà utilisé",
  expired: "Expiré",
};

/** Statuts d'une commande. */
export const ORDER_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  paid: "Payée",
  failed: "Échouée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

/** Statut de publication d'un événement. */
export const EVENT_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
} as const;
export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Brouillon",
  published: "Publié",
  cancelled: "Annulé",
  completed: "Terminé",
};

/** Confidentialité d'un salon événementiel (cf. §7 du cahier). */
export const SALON_PRIVACY = {
  PUBLIC: "public",
  MEMBERS: "members",
  PRIVATE: "private",
} as const;
export type SalonPrivacy = (typeof SALON_PRIVACY)[keyof typeof SALON_PRIVACY];

export const SALON_PRIVACY_LABELS: Record<SalonPrivacy, string> = {
  public: "Public",
  members: "Réservé aux participants",
  private: "Privé sur invitation",
};

/** Visibilité d'un participant dans la recherche (cf. §16 du cahier). */
export const VISIBILITY = {
  PUBLIC: "public",
  MEMBERS: "members",
  PRIVATE: "private",
} as const;
export type Visibility = (typeof VISIBILITY)[keyof typeof VISIBILITY];

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  public: "Visible par tous les utilisateurs",
  members: "Visible par les participants de mes événements",
  private: "Invisible dans la recherche",
};

/** Statut d'une demande de connexion (networking). */
export const CONNECTION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
} as const;
export type ConnectionStatus = (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];

/** Types de notification (cf. §26 du cahier). */
export const NOTIFICATION_TYPES = {
  POST_REPLY: "post_reply",
  MENTION: "mention",
  NEW_SALON_POST: "new_salon_post",
  NEW_MEMBER: "new_member",
  EVENT_REMINDER: "event_reminder",
  EVENT_UPDATE: "event_update",
  ORGANIZER_ANNOUNCEMENT: "organizer_announcement",
  POLL: "poll",
  CONNECTION_REQUEST: "connection_request",
  CONNECTION_ACCEPTED: "connection_accepted",
  TICKET_CONFIRMED: "ticket_confirmed",
  MESSAGE: "message",
  REPORT_RESOLVED: "report_resolved",
  TONTINE_INVITATION: "tontine_invitation",
} as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  post_reply: "Réponse à une publication",
  mention: "Mention",
  new_salon_post: "Nouvelle publication dans un salon",
  new_member: "Nouveau participant",
  event_reminder: "Rappel d'événement",
  event_update: "Changement d'horaire",
  organizer_announcement: "Annonce de l'organisateur",
  poll: "Sondage",
  connection_request: "Demande de connexion",
  connection_accepted: "Connexion acceptée",
  ticket_confirmed: "Billet confirmé",
  message: "Nouveau message",
  report_resolved: "Signalement traité",
  tontine_invitation: "Invitation à une tontine",
};

/** Nature d'une publication du salon. */
export const POST_KIND = {
  POST: "post",
  ANNOUNCEMENT: "announcement",
} as const;
export type PostKind = (typeof POST_KIND)[keyof typeof POST_KIND];

/** Réactions disponibles. */
export const REACTIONS = ["like", "love", "fire", "clap", "wow"] as const;
export type Reaction = (typeof REACTIONS)[number];

export const REACTION_LABELS: Record<Reaction, string> = {
  like: "J'aime",
  love: "J'adore",
  fire: "En feu",
  clap: "Bravo",
  wow: "Impressionnant",
};

/** Catégories d'événements (cf. §8.1 du cahier). */
export const CATEGORIES = [
  { slug: "concerts", label: "Concerts" },
  { slug: "conferences", label: "Conférences" },
  { slug: "formations", label: "Formations" },
  { slug: "networking", label: "Networking" },
  { slug: "sport", label: "Sport" },
  { slug: "culture", label: "Culture" },
  { slug: "humour", label: "Humour" },
  { slug: "festivals", label: "Festivals" },
  { slug: "entreprises", label: "Entreprises" },
  { slug: "associations", label: "Associations" },
  { slug: "etudiants", label: "Étudiants" },
  { slug: "technologie", label: "Technologie" },
  { slug: "mode", label: "Mode" },
  { slug: "gastronomie", label: "Gastronomie" },
  { slug: "autres", label: "Autres" },
] as const;
export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function getCategoryLabel(slug: string): string {
  return CATEGORIES.find((category) => category.slug === slug)?.label ?? "Autres";
}

/** Motifs de signalement (modération). */
export const REPORT_REASONS = [
  { value: "spam", label: "Spam ou publicité" },
  { value: "harassment", label: "Harcèlement ou intimidation" },
  { value: "hate", label: "Discours haineux" },
  { value: "violence", label: "Violence ou contenu choquant" },
  { value: "nudity", label: "Contenu sexuel ou nudité" },
  { value: "misinformation", label: "Fausse information" },
  { value: "other", label: "Autre" },
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number]["value"];

/** Cibles signalables. */
export const REPORT_TARGETS = ["post", "comment", "user", "event", "message"] as const;
export type ReportTarget = (typeof REPORT_TARGETS)[number];

/** Onglets du salon événementiel (cf. §13 du cahier). */
export const SALON_TABS = [
  { slug: "accueil", label: "Accueil" },
  { slug: "discussion", label: "Discussion" },
  { slug: "participants", label: "Participants" },
  { slug: "photos", label: "Photos" },
  { slug: "programme", label: "Programme" },
  { slug: "infos", label: "Infos" },
] as const;
export type SalonTab = (typeof SALON_TABS)[number]["slug"];

/** Tri des listes d'événements. */
export const EVENT_SORTS = [
  { value: "date_asc", label: "Date (plus proche)" },
  { value: "date_desc", label: "Date (plus éloignée)" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
] as const;
export type EventSort = (typeof EVENT_SORTS)[number]["value"];

/** Limites techniques et de validation. */
export const LIMITS = {
  MAX_AVATAR_BYTES: 2 * 1024 * 1024,
  MAX_COVER_BYTES: 5 * 1024 * 1024,
  MAX_PHOTO_BYTES: 10 * 1024 * 1024,
  ACCEPTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/avif"] as const,
  MAX_POST_LENGTH: 5000,
  MAX_COMMENT_LENGTH: 2000,
  MAX_BIO_LENGTH: 500,
  MAX_TICKETS_PER_ORDER: 10,
  PAGE_SIZE: 12,
  PAGE_SIZE_ADMIN: 25,
} as const;

/** Buckets Supabase Storage. */
export const STORAGE_BUCKETS = {
  AVATARS: "avatars",
  EVENT_COVERS: "event-covers",
  SALON_PHOTOS: "salon-photos",
} as const;

/** Routes principales de l'application. */
export const ROUTES = {
  home: "/",
  explore: "/explorer",
  login: "/connexion",
  register: "/inscription",
  forgotPassword: "/mot-de-passe-oublie",
  myTickets: "/mes-billets",
  myBadge: "/mon-badge",
  mySalons: "/mes-salons",
  tontines: "/tontines",
  cotisations: "/cotisations",
  connections: "/connexions",
  notifications: "/notifications",
  profile: "/profil",
  settings: "/reglages",
  orgDashboard: "/org",
  admin: "/admin",
} as const;

/** Clés de cookies / stockage local. */
export const STORAGE_KEYS = {
  THEME: "rassemble-theme",
  ONBOARDING_DONE: "rassemble-onboarding-done",
} as const;
