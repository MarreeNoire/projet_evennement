/* =============================================================================
   Types de la base de donnÃ©es
   --------------------------------------------------------------------------
   Fichier Ã©crit Ã  la main pour reflÃ©ter exactement supabase/migrations.
   Ã€ rÃ©gÃ©nÃ©rer depuis le projet rÃ©el avec :

       npm run db:types

   (nÃ©cessite la CLI Supabase et un projet liÃ©)
   ========================================================================== */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/* ------------------------------- Ã‰numÃ©rations ------------------------------ */

export type UserRole = "participant" | "organizer" | "admin";
export type OrgRole = "owner" | "manager" | "checkin_agent" | "moderator";
export type AccessLevel = "standard" | "vip" | "vvip";
export type VisibilityLevel = "public" | "members" | "private";
export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type TicketStatus = "pending" | "paid" | "cancelled" | "refunded" | "used" | "expired";
export type OrderStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";
export type PaymentStatus =
  "initiated" | "pending" | "accepted" | "refused" | "cancelled" | "refunded" | "error";
export type SalonPrivacy = "public" | "members" | "private";
export type PostKind = "post" | "announcement";
export type ReactionType = "like" | "love" | "fire" | "clap" | "wow";
export type ConnectionStatus = "pending" | "accepted" | "declined";
export type NotificationType =
  | "post_reply"
  | "mention"
  | "new_salon_post"
  | "new_member"
  | "event_reminder"
  | "event_update"
  | "organizer_announcement"
  | "poll"
  | "connection_request"
  | "connection_accepted"
  | "ticket_confirmed"
  | "message"
  | "report_resolved"
  | "tontine_invitation";
export type ReportTarget = "post" | "comment" | "user" | "event" | "message";
export type ReportReason =
  "spam" | "harassment" | "hate" | "violence" | "nudity" | "misinformation" | "other";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type MediaKind = "image" | "video";
export type TontineStatus = "active" | "completed" | "cancelled";
export type TontineMemberStatus = "invited" | "active" | "declined";
export type TontinePaymentStatus = "pending" | "paid";
export type CotisationCampaignStatus = "open" | "closed" | "completed";
export type CotisationContributionStatus = "pending" | "paid" | "failed" | "cancelled";
export type DiscountKind = "percentage" | "fixed";
export type CheckinResult =
  "valid" | "invalid" | "already_used" | "wrong_event" | "cancelled" | "refunded" | "unpaid";

/* --------------------------------- Tables ---------------------------------- */

export type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  interests: string[];
  visibility: VisibilityLevel;
  allow_search: boolean;
  allow_connections: boolean;
  allow_private_messages: boolean;
  is_verified: boolean;
  onboarding_completed: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserRoleRow = {
  id: string;
  user_id: string;
  role: UserRole;
  granted_by: string | null;
  granted_at: string;
};

export type OrganizationRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type OrganizationMemberRow = {
  id: string;
  organization_id: string;
  user_id: string | null;
  invited_email: string | null;
  role: OrgRole;
  status: string;
  invited_by: string | null;
  joined_at: string;
};

export type EventRow = {
  id: string;
  organization_id: string;
  created_by: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  cover_url: string | null;
  gallery: string[];
  category: string;
  tags: string[];
  venue_name: string | null;
  address: string | null;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  online_url: string | null;
  start_at: string;
  end_at: string;
  timezone: string;
  status: EventStatus;
  published_at: string | null;
  salon_privacy: SalonPrivacy;
  salon_open_before_hours: number;
  salon_open_after_hours: number | null;
  allow_member_discovery: boolean;
  allow_media_upload: boolean;
  capacity: number | null;
  currency: string;
  min_price: number;
  max_price: number;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type EventSessionRow = {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  room: string | null;
  start_at: string;
  end_at: string;
  position: number;
  is_break: boolean;
  created_at: string;
  updated_at: string;
};

export type EventSpeakerRow = {
  id: string;
  event_id: string;
  session_id: string | null;
  user_id: string | null;
  name: string;
  role_title: string | null;
  organization: string | null;
  bio: string | null;
  photo_url: string | null;
  links: Json;
  position: number;
  created_at: string;
};

export type EventSessionBookmarkRow = {
  id: string;
  session_id: string;
  user_id: string;
  created_at: string;
};

export type PostRow = {
  id: string;
  salon_id: string;
  author_id: string | null;
  kind: PostKind;
  content: string;
  media: Json;
  mentions: string[];
  reaction_count: number;
  comment_count: number;
  is_pinned: boolean;
  is_hidden: boolean;
  hidden_by: string | null;
  hidden_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type CommentRow = {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string | null;
  content: string;
  mentions: string[];
  reaction_count: number;
  is_hidden: boolean;
  hidden_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ReactionRow = {
  id: string;
  user_id: string;
  post_id: string | null;
  comment_id: string | null;
  reaction: ReactionType;
  created_at: string;
};

export type AlbumRow = {
  id: string;
  salon_id: string;
  event_id: string | null;
  name: string;
  description: string | null;
  cover_url: string | null;
  position: number;
  media_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MediaRow = {
  id: string;
  salon_id: string;
  event_id: string | null;
  album_id: string | null;
  post_id: string | null;
  uploader_id: string | null;
  kind: MediaKind;
  storage_path: string;
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  size_bytes: number | null;
  reaction_count: number;
  comment_count: number;
  is_hidden: boolean;
  hidden_by: string | null;
  created_at: string;
};

export type ReportRow = {
  id: string;
  reporter_id: string | null;
  target_type: ReportTarget;
  target_id: string;
  salon_id: string | null;
  event_id: string | null;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution: string | null;
  created_at: string;
};

export type TicketTypeRow = {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  sold_count: number;
  min_per_order: number;
  max_per_order: number;
  access_level: AccessLevel;
  benefits: string[];
  sale_start: string | null;
  sale_end: string | null;
  is_active: boolean;
  covers_salon: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

export type ConnectionRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: ConnectionStatus;
  message: string | null;
  origin: string;
  event_id: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BlockRow = {
  id: string;
  blocker_id: string;
  blocked_id: string;
  reason: string | null;
  created_at: string;
};

export type ConversationRow = {
  id: string;
  created_by: string | null;
  is_group: boolean;
  title: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
};

export type ConversationParticipantRow = {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at: string;
  is_archived: boolean;
  joined_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string | null;
  attachments: Json;
  is_hidden: boolean;
  edited_at: string | null;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  url: string | null;
  actor_id: string | null;
  event_id: string | null;
  salon_id: string | null;
  post_id: string | null;
  conversation_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  email_sent_at: string | null;
  created_at: string;
};

export type NotificationPreferenceRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  in_app: boolean;
  email: boolean;
  push: boolean;
  updated_at: string;
};

export type AuditLogRow = {
  id: number;
  actor_id: string | null;
  actor_role: UserRole | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  organization_id: string | null;
  event_id: string | null;
  before: Json | null;
  after: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type PlatformSettingRow = {
  key: string;
  value: Json;
  description: string | null;
  is_public: boolean;
  updated_by: string | null;
  updated_at: string;
};

export type PayoutRow = {
  id: string;
  organization_id: string;
  event_id: string | null;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  currency: string;
  status: string;
  method: string | null;
  reference: string | null;
  period_start: string | null;
  period_end: string | null;
  processed_by: string | null;
  processed_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type TontineRow = {
  id: string;
  creator_id: string;
  title: string;
  contribution_amount: number;
  frequency: "monthly";
  starts_on: string;
  currency: string;
  status: TontineStatus;
  created_at: string;
  updated_at: string;
};

export type TontineMemberRow = {
  id: string;
  tontine_id: string;
  user_id: string;
  invited_by: string;
  role: "owner" | "member";
  status: TontineMemberStatus;
  joined_at: string | null;
  created_at: string;
};

export type TontineCycleRow = {
  id: string;
  tontine_id: string;
  cycle_number: number;
  due_on: string;
  beneficiary_user_id: string | null;
  drawn_at: string | null;
  status: "pending" | "drawn";
  created_at: string;
};

export type TontinePaymentRow = {
  id: string;
  cycle_id: string;
  tontine_id: string;
  user_id: string;
  amount: number;
  status: TontinePaymentStatus;
  paid_at: string | null;
  marked_paid_by: string | null;
  created_at: string;
};

export type CotisationCampaignRow = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  target_amount: number | null;
  fixed_amount: number | null;
  ends_at: string | null;
  currency: string;
  status: CotisationCampaignStatus;
  created_at: string;
  updated_at: string;
};

export type CotisationContributionRow = {
  id: string;
  campaign_id: string;
  contributor_id: string;
  amount: number;
  currency: string;
  is_anonymous: boolean;
  status: CotisationContributionStatus;
  provider: string | null;
  provider_transaction_id: string | null;
  provider_payment_url: string | null;
  paid_at: string | null;
  created_at: string;
};

/* ---------------------------------- Vues ---------------------------------- */

/** Vue publique des Ã©vÃ©nements Ã  venir. */
export type PublishedEventView = {
  id: string;
  organization_id: string;
  title: string;
  slug: string;
  summary: string | null;
  cover_url: string | null;
  gallery: string[];
  category: string;
  tags: string[];
  venue_name: string | null;
  address: string | null;
  city: string;
  country: string;
  start_at: string;
  end_at: string;
  timezone: string;
  capacity: number | null;
  min_price: number;
  max_price: number;
  currency: string;
  salon_privacy: SalonPrivacy;
  organizer_name: string;
  organizer_slug: string;
  organizer_logo_url: string | null;
  organizer_verified: boolean;
};

/** Statistiques agrÃ©gÃ©es d'un Ã©vÃ©nement (tableau de bord organisateur). */
export type EventStatsView = {
  event_id: string;
  organization_id: string;
  status: EventStatus;
  start_at: string;
  capacity: number | null;
  tickets_sold: number;
  gross_revenue: number;
  commission: number;
  net_revenue: number;
  paid_orders: number;
  checked_in: number;
  salon_members: number;
  salon_posts: number;
};

/** Billet du participant, enrichi des informations d'Ã©vÃ©nement. */
export type MyTicketView = {
  id: string;
  reference: string;
  qr_token: string;
  status: TicketStatus;
  access_level: AccessLevel;
  holder_name: string | null;
  price_paid: number;
  checked_in_at: string | null;
  created_at: string;
  event_id: string;
  event_title: string;
  event_slug: string;
  event_cover_url: string | null;
  event_start_at: string;
  event_end_at: string;
  venue_name: string | null;
  city: string;
  ticket_type_name: string;
  ticket_benefits: string[];
  organizer_slug: string;
  organizer_name: string;
};

/** Participant d'un salon, filtrÃ© par ses prÃ©fÃ©rences de visibilitÃ©. */
export type SalonVisibleMemberView = {
  salon_id: string;
  user_id: string;
  joined_at: string;
  role: OrgRole;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  interests: string[];
};

/** Notification de l'utilisateur connectÃ©. */
export type MyNotificationView = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  url: string | null;
  is_read: boolean;
  created_at: string;
  event_id: string | null;
  salon_id: string | null;
  post_id: string | null;
  conversation_id: string | null;
  actor_id: string | null;
  actor_name: string | null;
  actor_avatar_url: string | null;
};

/** Conversation de l'utilisateur connectÃ©. */
export type MyConversationView = {
  conversation_id: string;
  last_message_at: string;
  peer_id: string | null;
  peer_name: string | null;
  peer_avatar_url: string | null;
  last_message_content: string | null;
  last_message_created_at: string | null;
  last_message_sender_id: string | null;
};

/* ------------------------------ DÃ©finition -------------------------------- */

type TableDefinition<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type ViewDefinition<Row> = {
  Row: Row;
  Relationships: [];
};

export type DatabaseFunctions = {
  is_admin: { Args: { user_id?: string }; Returns: boolean };
  has_role: { Args: { required_role: UserRole; user_id?: string }; Returns: boolean };
  is_org_member: { Args: { org_id: string; user_id?: string }; Returns: boolean };
  can_manage_org: { Args: { org_id: string; user_id?: string }; Returns: boolean };
  can_manage_event: { Args: { event_id: string; user_id?: string }; Returns: boolean };
  can_view_profile: { Args: { target_id: string; viewer_id?: string }; Returns: boolean };
  can_access_salon: { Args: { salon_id: string; user_id?: string }; Returns: boolean };
  can_moderate_salon: { Args: { salon_id: string; user_id?: string }; Returns: boolean };
  has_valid_ticket: { Args: { event_id: string; user_id?: string }; Returns: boolean };
  highest_access_level: { Args: { event_id: string; user_id?: string }; Returns: AccessLevel };
  is_blocked_between: { Args: { user_a: string; user_b: string }; Returns: boolean };
  is_conversation_member: { Args: { conversation_id: string; user_id?: string }; Returns: boolean };
  unread_notification_count: { Args: Record<string, never>; Returns: number };
  ensure_event_salon: { Args: { target_event_id: string }; Returns: string };
  generate_tickets_for_order: { Args: { target_order_id: string }; Returns: number };
  log_audit: {
    Args: {
      p_action: string;
      p_entity_type: string;
      p_entity_id: string;
      p_organization_id?: string | null;
      p_event_id?: string | null;
      p_before?: Json | null;
      p_after?: Json | null;
    };
    Returns: undefined;
  };
  admin_set_user_role: {
    Args: { p_user_id: string; p_role: UserRole; p_grant: boolean };
    Returns: undefined;
  };
  resolve_report: {
    Args: {
      p_report_id: string;
      p_status: ReportStatus;
      p_resolution?: string | null;
      p_hide_target?: boolean;
    };
    Returns: undefined;
  };
  perform_check_in: {
    Args: { p_event_id: string; p_code: string; p_scanner_id?: string };
    Returns: {
      result: CheckinResult;
      ticket_id: string | null;
      ticket_reference: string | null;
      holder_name: string | null;
      ticket_type_name: string | null;
      access_level: AccessLevel | null;
      message: string | null;
    }[];
  };
  become_organizer: { Args: { p_org_name: string }; Returns: OrganizationRow };
  is_tontine_participant: { Args: { target_tontine_id: string; target_user_id?: string }; Returns: boolean };
  tontine_ensure_current_period: { Args: { p_tontine_id: string; p_requested_by: string }; Returns: TontineCycleRow };
  draw_tontine_beneficiary: { Args: { p_tontine_id: string; p_requested_by: string }; Returns: TontineCycleRow };
  tontine_mark_payment_paid: { Args: { p_payment_id: string; p_marked_by: string }; Returns: TontinePaymentRow };
  tontine_respond_invitation: { Args: { p_tontine_id: string; p_user_id: string; p_accept: boolean }; Returns: TontineMemberRow };
  cotisation_campaign_totals: { Args: { p_campaign_id: string }; Returns: { total_amount: number; contributor_count: number }[] };
  cotisation_confirm_contribution: { Args: { p_transaction_id: string; p_expected_amount: number; p_currency: string }; Returns: boolean };
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<ProfileRow>;
      user_roles: TableDefinition<UserRoleRow>;
      organizations: TableDefinition<OrganizationRow>;
      organization_members: TableDefinition<OrganizationMemberRow>;
      events: TableDefinition<EventRow>;
      event_sessions: TableDefinition<EventSessionRow>;
      event_speakers: TableDefinition<EventSpeakerRow>;
      event_session_bookmarks: TableDefinition<EventSessionBookmarkRow>;
      ticket_types: TableDefinition<TicketTypeRow>;
      promo_codes: TableDefinition<PromoCodeRow>;
      orders: TableDefinition<OrderRow>;
      order_items: TableDefinition<OrderItemRow>;
      payments: TableDefinition<PaymentRow>;
      tickets: TableDefinition<TicketRow>;
      check_ins: TableDefinition<CheckInRow>;
      salons: TableDefinition<SalonRow>;
      salon_members: TableDefinition<SalonMemberRow>;
      posts: TableDefinition<PostRow>;
      comments: TableDefinition<CommentRow>;
      reactions: TableDefinition<ReactionRow>;
      albums: TableDefinition<AlbumRow>;
      media: TableDefinition<MediaRow>;
      reports: TableDefinition<ReportRow>;
      connections: TableDefinition<ConnectionRow>;
      blocks: TableDefinition<BlockRow>;
      conversations: TableDefinition<ConversationRow>;
      conversation_participants: TableDefinition<ConversationParticipantRow>;
      messages: TableDefinition<MessageRow>;
      notifications: TableDefinition<NotificationRow>;
      notification_preferences: TableDefinition<NotificationPreferenceRow>;
      audit_logs: TableDefinition<AuditLogRow>;
      platform_settings: TableDefinition<PlatformSettingRow>;
      payouts: TableDefinition<PayoutRow>;
      tontines: TableDefinition<TontineRow>;
      tontine_members: TableDefinition<TontineMemberRow>;
      tontine_cycles: TableDefinition<TontineCycleRow>;
      tontine_payments: TableDefinition<TontinePaymentRow>;
      cotisation_campaigns: TableDefinition<CotisationCampaignRow>;
      cotisation_contributions: TableDefinition<CotisationContributionRow>;
    };
    Views: {
      published_events: ViewDefinition<PublishedEventView>;
      event_stats: ViewDefinition<EventStatsView>;
      my_tickets: ViewDefinition<MyTicketView>;
      salon_visible_members: ViewDefinition<SalonVisibleMemberView>;
      my_notifications: ViewDefinition<MyNotificationView>;
      my_conversations: ViewDefinition<MyConversationView>;
    };
    Functions: DatabaseFunctions;
    Enums: {
      user_role: UserRole;
      org_role: OrgRole;
      access_level: AccessLevel;
      visibility_level: VisibilityLevel;
      event_status: EventStatus;
      ticket_status: TicketStatus;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      salon_privacy: SalonPrivacy;
      post_kind: PostKind;
      reaction_type: ReactionType;
      connection_status: ConnectionStatus;
      notification_type: NotificationType;
      report_target: ReportTarget;
      report_reason: ReportReason;
      report_status: ReportStatus;
      media_kind: MediaKind;
      discount_kind: DiscountKind;
      checkin_result: CheckinResult;
    };
    CompositeTypes: Record<never, never>;
  };
};

/* ------------------------------ Raccourcis --------------------------------- */

/** Ligne d'une table. Ex : `Tables<"events">` */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

/** Insertion dans une table. Ex : `TableInsert<"events">` */
export type TableInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

/** Mise Ã  jour d'une table. Ex : `TableUpdate<"events">` */
export type TableUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

/** Ligne d'une vue. Ex : `Views<"published_events">` */
export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];

export type PromoCodeRow = {
  id: string;
  organization_id: string;
  event_id: string | null;
  code: string;
  description: string | null;
  discount_kind: DiscountKind;
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  max_uses_per_user: number;
  min_order_amount: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderRow = {
  id: string;
  reference: string;
  user_id: string;
  event_id: string;
  organization_id: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  fees: number;
  total: number;
  commission: number;
  currency: string;
  promo_code_id: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  ticket_type_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
};

export type PaymentRow = {
  id: string;
  order_id: string;
  provider: string;
  provider_transaction_id: string;
  provider_payment_token: string | null;
  provider_payment_url: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string | null;
  channel: string | null;
  payer_phone: string | null;
  payload: Json;
  error_message: string | null;
  initiated_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketRow = {
  id: string;
  reference: string;
  qr_token: string;
  order_id: string;
  order_item_id: string | null;
  event_id: string;
  user_id: string;
  ticket_type_id: string;
  status: TicketStatus;
  access_level: AccessLevel;
  holder_name: string | null;
  holder_email: string | null;
  price_paid: number;
  checked_in_at: string | null;
  checked_in_by: string | null;
  cancelled_at: string | null;
  refunded_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CheckInRow = {
  id: string;
  ticket_id: string | null;
  event_id: string;
  scanned_by: string | null;
  result: CheckinResult;
  scanned_code: string | null;
  note: string | null;
  device: string | null;
  created_at: string;
};

export type SalonRow = {
  id: string;
  event_id: string | null;
  organization_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  privacy: SalonPrivacy;
  access_level: AccessLevel;
  is_recurring: boolean;
  require_ticket: boolean;
  member_count: number;
  post_count: number;
  auto_join: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SalonMemberRow = {
  id: string;
  salon_id: string;
  user_id: string;
  role: OrgRole;
  is_muted: boolean;
  joined_at: string;
  left_at: string | null;
  last_read_at: string;
};
