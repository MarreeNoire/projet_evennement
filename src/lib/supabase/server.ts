import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Client Supabase côté serveur, lié à la session de l'utilisateur courant.
 * Respecte intégralement les politiques RLS.
 */
export async function createSupabaseServerClient() {
  if (!env.supabase.url || !env.supabase.anonKey) {
    console.error("Supabase not configured in server:", {
      url: env.supabase.url,
      anonKey: env.supabase.anonKey,
    });
    throw new Error(
      "Supabase n'est pas configuré. Renseigne NEXT_PUBLIC_SUPABASE_URL et " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabase.url, env.supabase.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Appelé depuis un Server Component en lecture seule :
          // la modification des cookies est alors impossible, ce qui est sans
          // conséquence car le middleware rafraîchit déjà la session.
        }
      },
    },
  });
}

/**
 * Récupère l'utilisateur authentifié, ou `null`.
 * Toujours utiliser `auth.getUser()` (et non `getSession()`) côté serveur :
 * c'est la seule méthode qui valide le jeton auprès de Supabase.
 */
export const getCurrentUser = cache(async function getCurrentUser() {
  if (!env.supabase.url || !env.supabase.anonKey) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user ?? null;
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
});

/** Profil complet + rôles de l'utilisateur connecté. */
export const getCurrentProfile = cache(async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();

  const [{ data: profile }, { data: roles }, { data: ownedOrgs }, { data: memberOrgs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.from("organizations").select("id").eq("owner_id", user.id).limit(1),
    supabase.from("organization_members").select("id").eq("user_id", user.id).limit(1),
  ]);

  if (!profile) return null;

  const rolesList = (roles ?? []).map((row) => row.role);
  const hasOrg = (ownedOrgs && ownedOrgs.length > 0) || (memberOrgs && memberOrgs.length > 0);

  if (hasOrg && !rolesList.includes("organizer")) {
    rolesList.push("organizer");
  }

  return {
    ...profile,
    roles: rolesList,
  };
});
