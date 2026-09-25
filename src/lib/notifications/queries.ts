import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MyNotificationView } from "@/types/database";

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
