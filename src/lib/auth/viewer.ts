import type { HeaderUser } from "@/components/layout/header-types";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";

/* =============================================================================
   Visiteur courant, réduit aux informations utiles à l'en-tête
   --------------------------------------------------------------------------
   Source unique pour l'accueil et le shell public : la fiche `profiles` fait
   foi, avec repli sur la session Supabase si la fiche manque. Une erreur de
   lecture ne casse jamais le rendu public : on retombe sur l'état déconnecté.
   ========================================================================== */

export async function loadHeaderUser(): Promise<HeaderUser | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const profile = await getCurrentProfile();
    if (profile) {
      return {
        id: profile.id,
        displayName: profile.display_name,
        username: profile.username,
        avatarUrl: profile.avatar_url,
        isOrganizer: profile.roles.includes("organizer"),
        isAdmin: profile.roles.includes("admin"),
      };
    }

    const user = await getCurrentUser();
    if (!user) return null;

    return {
      id: user.id,
      displayName: user.email?.split("@")[0] || "Mon compte",
      username: null,
      avatarUrl: null,
      isOrganizer: false,
      isAdmin: false,
    };
  } catch {
    return null;
  }
}
