"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Marque toutes les notifications de l'utilisateur courant comme lues. */
export async function markAllNotificationsRead(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Connecte-toi pour continuer." };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return { success: false, error: error.message };

  revalidatePath("/notifications");
  return { success: true };
}

/** Marque comme lue une notification qui appartient à la session courante. */
export async function markNotificationRead(
  notificationId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { success: false, error: "Connecte-toi pour continuer." };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userData.user.id)
    .eq("is_read", false);

  if (error) return { success: false, error: error.message };
  revalidatePath("/notifications");
  return { success: true };
}
