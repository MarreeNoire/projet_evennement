import { redirect } from "next/navigation";
import { Bell, Megaphone, MessageCircle, Sparkles, Ticket, UserPlus } from "lucide-react";
import type { ComponentType } from "react";

import { MarkAllReadButton } from "@/components/social/mark-all-read-button";
import { NotificationLink } from "@/components/social/notification-link";
import { SocialPageHeader, SocialShell } from "@/components/social/social-shell";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/states";
import { ROUTES } from "@/lib/constants";
import { getMyNotifications, getUnreadNotificationCount } from "@/lib/notifications/queries";
import { formatRelative } from "@/lib/social/time";
import { getCurrentProfile } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { MyNotificationView, NotificationType } from "@/types/database";

export const metadata = {
  title: "Notifications",
  description: "Réponses, mentions, annonces et rappels de tes événements.",
};

/* =============================================================================
   Notifications — journal chronologique
   --------------------------------------------------------------------------
   Une colonne verticale, une icône par type d'événement plutôt qu'une carte
   par notification : ça se lit comme un journal de bord, pas comme un fil
   de réseau social générique.
   ========================================================================== */

const ICONS: Record<NotificationType, ComponentType<{ className?: string }>> = {
  post_reply: MessageCircle,
  mention: MessageCircle,
  new_salon_post: MessageCircle,
  new_member: UserPlus,
  event_reminder: Bell,
  event_update: Bell,
  organizer_announcement: Megaphone,
  poll: Sparkles,
  connection_request: UserPlus,
  connection_accepted: UserPlus,
  ticket_confirmed: Ticket,
  message: MessageCircle,
  report_resolved: Bell,
};

export default async function NotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`${ROUTES.login}?redirect=${ROUTES.notifications}`);

  const [notifications, unreadCount] = await Promise.all([
    getMyNotifications(),
    getUnreadNotificationCount(),
  ]);

  return (
    <SocialShell active="notifications">
      <div className="flex flex-col gap-8">
        <SocialPageHeader
          eyebrow="Notifications"
          title="Ce que tu as"
          accent="manqué."
          description={
            unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}.`
              : "Tout est à jour."
          }
          action={unreadCount > 0 ? <MarkAllReadButton /> : undefined}
        />

        {notifications.length === 0 ? (
          <EmptyState
            title="Rien pour l'instant"
            description="Les réponses, mentions et annonces de tes événements apparaîtront ici."
          />
        ) : (
          <ol className="border-border flex flex-col border-t">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <NotificationRow notification={notification} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </SocialShell>
  );
}

function NotificationRow({ notification }: { notification: MyNotificationView }) {
  const Icon = ICONS[notification.type] ?? Bell;
  const content = (
    <div
      className={cn(
        "border-border flex items-start gap-4 border-b py-4 transition-colors duration-150",
        !notification.is_read && "bg-accent-subtle/40",
      )}
    >
      {notification.actor_id ? (
        <Avatar
          src={notification.actor_avatar_url}
          name={notification.actor_name ?? "?"}
          size="sm"
        />
      ) : (
        <span
          aria-hidden="true"
          className="border-border-strong text-fg-muted flex size-10 shrink-0 items-center justify-center rounded-sm border"
        >
          <Icon className="size-[18px]" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className={cn("text-[15px]", !notification.is_read && "font-semibold")}>
          {notification.title}
        </p>
        {notification.body ? (
          <p className="text-fg-muted mt-0.5 line-clamp-2 text-sm">{notification.body}</p>
        ) : null}
        <p className="text-fg-subtle mt-1 text-xs">{formatRelative(notification.created_at)}</p>
      </div>

      {!notification.is_read ? (
        <span aria-hidden="true" className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
      ) : null}
    </div>
  );

  return (
    <NotificationLink
      href={notification.url ?? "/notifications"}
      notificationId={notification.id}
      isRead={notification.is_read}
    >
      {content}
    </NotificationLink>
  );
}
