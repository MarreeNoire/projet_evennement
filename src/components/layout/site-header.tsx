import { HeaderShell, type HeaderUser } from "./header-shell";

import { env, isSupabaseConfigured } from "@/lib/env";
import { getCurrentProfile, createSupabaseServerClient } from "@/lib/supabase/server";

/* =============================================================================
   En-tête (vue serveur)
   --------------------------------------------------------------------------
   Récupère la session et le compteur de notifications non lues, puis délègue
   le rendu interactif à `HeaderShell`.

   Si Supabase n'est pas encore configuré (mode démonstration), l'en-tête
   s'affiche en version publique : l'application reste navigable.
   ========================================================================== */

export async function SiteHeader() {
  let user: HeaderUser | null = null;
  let unreadCount = 0;

  if (isSupabaseConfigured) {
    try {
      const profile = await getCurrentProfile();

      if (profile) {
        user = {
          id: profile.id,
          displayName: profile.display_name,
          username: profile.username,
          avatarUrl: profile.avatar_url,
          isOrganizer: profile.roles.includes("organizer"),
          isAdmin: profile.roles.includes("admin"),
        };

        const supabase = await createSupabaseServerClient();
        const { data } = await supabase.rpc("unread_notification_count");
        unreadCount = typeof data === "number" ? data : 0;
      }
    } catch {
      // Une session illisible ne doit jamais casser l'affichage public.
      user = null;
    }
  }

  const demo = !isSupabaseConfigured;

  return (
    <>
      {demo ? (
        <div className="border-b border-info/25 bg-info-subtle px-4 py-2 text-center text-xs font-medium text-info">
          Mode installation : Supabase n'est pas encore configuré. Ajoute les clés dans
          {" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono">.env.local</code> pour activer
          les comptes ({env.appName}).
        </div>
      ) : null}
      <HeaderShell user={user} unreadCount={unreadCount} />
    </>
  );
}