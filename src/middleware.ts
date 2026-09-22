import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/* =============================================================================
   Middleware de session Supabase
   --------------------------------------------------------------------------
   * Rafraîchit les cookies de session à chaque requête (obligatoire avec
     @supabase/ssr, sinon la session expire côté serveur).
   * Ne bloque AUCUNE route ici : la protection se fait page par page avec
     `getCurrentUser()` + `redirect()`, pour garder des messages d'erreur
     clairs et des pages publiques ultra-rapides.
   ========================================================================== */

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sans configuration Supabase : laisse passer (mode installation / démo).
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response = NextResponse.next({ request });
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Valide / rafraîchit la session (ne lève jamais : les pages gèrent le cas).
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Toutes les routes sauf : assets Next, images, favicon, fichiers publics.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
