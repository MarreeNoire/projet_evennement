import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MyNotificationView, NotificationPreferenceRow } from "@/types/database";

/** Dernières notifications de l'utilisateur courant (vue `my_notifications`, RLS = auth.uid()). */
export async function getMyNotifications(limit = 50): Promise<MyNotificationView[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("my_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getMyNotifications]", error.message);
    return [];
  }

  return (data ?? []) as unknown as MyNotificationView[];
}

/** Compteur exact, indépendant de la limite d'affichage de la liste. */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return 0;

  const { data, error } = await supabase.rpc("unread_notification_count");
  if (error) {
    console.error("[getUnreadNotificationCount]", error.message);
    return 0;
  }
  return data ?? 0;
}

/** Préférences du compte courant; RLS restreint la lecture à son propriétaire. */
export async function getMyNotificationPreferences(): Promise<NotificationPreferenceRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userData.user.id);
  if (error) {
    console.error("[getMyNotificationPreferences]", error.message);
    return [];
  }
  return data ?? [];
}
