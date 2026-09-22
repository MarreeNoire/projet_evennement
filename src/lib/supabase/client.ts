import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Client Supabase côté navigateur.
 * Utilise uniquement la clé publique (`anon`) : toutes les protections
 * reposent sur les politiques RLS définies dans supabase/migrations.
 */
export function createSupabaseBrowserClient() {
  if (!env.supabase.url || !env.supabase.anonKey) {
    throw new Error(
      "Supabase n'est pas configuré. Renseigne NEXT_PUBLIC_SUPABASE_URL et " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local.",
    );
  }

  return createBrowserClient<Database>(env.supabase.url, env.supabase.anonKey);
}

let cachedClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

/** Instance unique réutilisée dans le navigateur (évite les fuites de sockets). */
export function getSupabaseBrowserClient() {
  cachedClient ??= createSupabaseBrowserClient();
  return cachedClient;
}