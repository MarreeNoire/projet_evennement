import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env, isSupabaseAdminConfigured } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Client Supabase à privilèges élevés (service_role).
 *
 * ⚠️  À N'UTILISER QUE CÔTÉ SERVEUR, JAMAIS DANS UN COMPOSANT CLIENT.
 *     Cette clé contourne toutes les politiques RLS.
 *
 * Cas d'usage légitimes :
 *   - traitement des webhooks de paiement (l'appelant n'a pas de session) ;
 *   - génération des billets après confirmation du paiement ;
 *   - journalisation d'audit et tâches des crons ;
 *   - création de notifications pour d'autres utilisateurs.
 */
export function createSupabaseAdminClient(): SupabaseClient<Database> {
  if (!isSupabaseAdminConfigured) {
    throw new Error(
      "Client administrateur indisponible : renseigne SUPABASE_SERVICE_ROLE_KEY " +
        "dans .env.local (variable strictement serveur).",
    );
  }

  return createClient<Database>(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { "X-Client-Info": "rassemble-admin" },
    },
  });
}

let cachedAdminClient: SupabaseClient<Database> | null = null;

/** Instance unique du client administrateur. */
export function getSupabaseAdminClient(): SupabaseClient<Database> {
  cachedAdminClient ??= createSupabaseAdminClient();
  return cachedAdminClient;
}